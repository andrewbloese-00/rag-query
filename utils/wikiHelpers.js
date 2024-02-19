

//custom lib
import { getAverageEmbedding, embeddingFetch, getEmbeddings} from './embeddings.js'
import { enrichQuery } from "./aiHelpers.js";
import { useMongo } from './db.js';
import { ObjectId } from 'mongodb';



//preferences
const EMBED_TOKEN_PER_WINDOW = 500
const EMBED_SENTENCE_OVERLAP = 2;


const DEFAULT_COLOR = {fg: "#fff", bg: "royalblue"};
export async function createWikiTag(name,color=DEFAULT_COLOR){
    try {

        const db = await useMongo()
        const data = {name, color}
        const { insertedId } = await db.collection("wiki_tags").insertOne(data)
        return { tag_id: insertedId, error: null }

        
    } catch (error) {
        console.warn("Failed to create Wiki Tag")
        console.error(error);
        return { tag_id: null, error: error.message || error || "Unknown error" };
    }
}




//TODO: Reformat to use a transaction maybe? 
/**
 * @about generates text embeddings for information (calculating the average) and creates a new wiki page and nodes for the information provided in 'text' searchable via the 'title' and embedding
 * @param {string} title the title of the information being uploaded
 * @param {string} text the information text
 * @param {string[]} tags the id(s) of wiki_tag(s) to be applied to the wiki page
 * @returns {Promise<{success:{wiki_page_id:string,subnodes:string[]}, error: null}> | Promise<{success:null, error:string}>}
 */
export async function insertWikiPage(wikiId,title,text,tags=[]){
    const db = await useMongo();
    console.time("Generate Text Embeddings")
    const embeddings = await getEmbeddings(text,EMBED_TOKEN_PER_WINDOW,EMBED_SENTENCE_OVERLAP)
    if(embeddings.length === 0) return { success: null, error: "Failed to insert document: Couldn't generate any text embeddings!"}
    console.timeEnd("Generate Text Embeddings")

    console.time("Calculate doc level embedding (average)")
    const document_embedding = getAverageEmbedding(embeddings)
    console.timeEnd("Calculate doc level embedding (average)")
    
    try {
        console.time("Create A New Document")
        console.time("insert 'wiki_page'")
        const docData = {wiki_id: wikiId, title, text, tags, document_embedding} //only apply tags to page documents
        const docResponse = await db.collection('wiki_pages').insertOne(docData);
        console.timeEnd("Create A New Document")
        if(!docResponse.acknowledged) return { success: null, error: "Failed to insert document: MongoError"}
        
        
        //apply titles to the embeddings for insertion as 'wiki_nodes'
        for(let i = 0; i < embeddings.length; i++) {
            embeddings[i]['wiki_page_title'] = title
        }

        const bulkInsert = await db.collection('wiki_nodes').insertMany(embeddings)
        if( !bulkInsert.acknowledged ) return { error: "Failed to insert wiki nodes: MongoError" }
        

        return { success: {wiki_page_id: docResponse.insertedId, subnodes: Array.from(Object.values(bulkInsert.insertedIds))} , error: null}


        
    } catch (error) {
        console.error(error)
        console.timeEnd("Create A New Document")
        return { success: null, error: error.message || error || "Unknown Error" }
        
    }
}

//TODO: test
/**
 * @about Removes all wiki_nodes and the wiki_page with a title of "title" using a mongdb transaction
 * @param {string} title the title of the wiki to delete
 */
export async function deleteWikiPage(title){
    const db = await useMongo()
    let success = true; 
    
    // create deletion transaction
    console.log("Started Delete Transaction")
    console.time("delete wiki transaction commited")
    const session = client.startSession()
    try {
        session.startTransaction()
        const removeNodes = db.collection("wiki_nodes").deleteMany({wiki_title: title},{session})
        const removePage = db.collection("wiki_page").deleteOne({title},{session})
        await Promise.all([removeNodes,removePage])
        
        await session.commitTransaction()
    } catch (error) {
        success = false        
        console.error(error)
        
    } finally { 
        await session.endSession()
        console.timeEnd("delete wiki transaction")
        console.log(success?"COMMITED":"ERROR")
        const message = success ? "Deleted Wiki Nodes and Page successfully" : "Failed to Delete Wiki Nodes"
        return { success, message }
    }
}

    



//TODO: do tests
/**
 * @typedef {{ wikiId:string, searchText: string, tags: string[], n: number, useEnrichment:boolean}} WikiNodeQuery
 */

/**@param {WikiNodeQuery} wikiQuery */
export async function queryWikiNodes(wikiQuery){
    if(!wikiQuery.searchText) { 
        console.error("Must provide a search text to query wiki nodes");
        return { result: null,  error: "Required parameter 'searchText' undefined "};
    }
	const db = await useMongo();
    let queryNode = { text: wikiQuery.searchText, embedding: [] }


    // query "enrichment" *optional*
    if(wikiQuery.useEnrichment){
        const { query , error} = await enrichQuery(wikiQuery.searchText)
        if(error) { 
            console.warn("Did not enrich, using original search query...")
        } else { 
            queryNode.text = query;
        }
    }

    //modifies the query node directly and applies its embedding
	const embedReply = await embeddingFetch(queryNode)
    //failed to embed return empty results
	if(embedReply.error || queryNode.embedding.length === 0) {
        console.warn("failed to embed, aborting query...")
        console.error("REASON: ",embedReply.error)
        return []
    }


    //filter by wiki_title where wiki has given tags
    let titles = [] 
    if(wikiQuery.tags.length > 0){
        console.time("Filter By Tags")
        const matches = await db.collection("wiki_pages").find({wiki_id: wikiQuery.wikiId,tags: { $in: wikiQuery.tags }})
        titles = matches.map(match=>match.title) //grab the wiki titles 
        console.timeEnd("Filter By Tags")
    }

    //vector search pipeline, uses cosine similarity on wiki_nodes to fetch relevant information
	const aggregation = [
		{
			$vectorSearch: {
				index: "wiki-node-embeddings",
				path: "embedding",
				queryVector: queryNode.embedding, 
				numCandidates: 200,
				limit: n

			}
		},
		{
		  $project: {
			score: {$meta: 'vectorSearchScore'},
			text: 1,
			wiki_title: 1,
			_id: 0
		  } 
		}
	]


    //add title matching stage if provided - make it first stage in pipeline
    if(titles.length){
        aggregation.unshift({$match: { wiki_title: {$in: titles}}})
    }

    //execute aggregation 
	const result = await db.collection("wiki_nodes")
		.aggregate(aggregation).toArray();

	return { result , error: null }
}

export async function checkUserPermission(wiki_id,user){
    const uid = user._id.toHexString();
    const db = await useMongo()
    const wiki = await db.collection("wikis").findOne({_id: ObjectId.createFromHexString(wiki_id)})
    return wiki.members.some(memberId => memberId === uid);
}