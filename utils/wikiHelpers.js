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
//very expensive...
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
        const docData = {wiki_id: wikiId, title, text, tags, document_embedding} //only apply tags to page documents
        const docResponse = await db.collection('wiki_pages').insertOne(docData);
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

/**
 * @param {string} wikiPageId the hex string of the wiki_page object id.  
 * @param {string[]} newTags the tags to set as the wiki_page tags
 */
export async function setWikiTags(wikiPageId, newTags=[]){
    try {
        const db = await useMongo()
        const _id = ObjectId.createFromHexString(wikiPageId)
        await db.collection("wiki_pages").updateOne({_id},{
            $set: { tags: newTags}
        })
        return { success: true, message: "Successfully updated wiki tags!"}
    
    } catch (error) {
        console.warn("Error in setWikiTags")
        console.error(error)
        return { success: false, message: error.message || error || "Unknown Error"}    
    }
}
export async function addWikiTag(wikiPageId,newTag){
    try {
        const db = await useMongo()
        const _id = ObjectId.createFromHexString(wikiPageId)
        await db.collection("wiki_pages").updateOne({_id},{
            $push: { tags: newTag}
        })
        return { success: true, message: "Successfully updated wiki tags!"}
    } catch (error) {
        console.warn("Error in setWikiTags")
        console.error(error)
        return { success: false, message: error.message || error || "Unknown Error"}    
    }
    
}

export async function updateWikiPageTitle(wikiPageId,newTitle){    
    try {
        const db = await useMongo();
        const _id = ObjectId.createFromHexString(wikiPageId)
        const wikiPage = await db.collection("wiki_pages").findOne({_id})
        //update the related wiki nodes to reflect the new title
        const wikiNodesUpdate = await db.collection("wiki_nodes")
            .updateMany(
                {wiki_title: wikiPage.title}, 
                {$set: {wiki_title: newTitle} }
            )
    
        //if the node renames failed then abort the update
        if(wikiNodesUpdate.modifiedCount === 0){
            throw new Error("Failed to update wiki node titles, aborting rename...");
        }
        
        //otherwise update the wikiPage directly
        const wikiPageUpdate = await db.collection("wiki_pages")
            .updateOne({_id},{ $set: {title: newTitle}})
        if(wikiPageUpdate.modifiedCount === 0) throw new Error("Failed to update wiki page title. ")
    
        return { success: true, message: "Successfully updated wiki page title and related nodes."}
    } catch (error) {
        return {success: false, message: error.message || error || "Unknown Error"}
    }
}

//very expensive...
export async function updateWikiPageText(wikiPageId , newText){
    try {
        const db = await useMongo();
        const _id = ObjectId.createFromHexString(wikiPageId); 
        const wikiPage = await db.collection("wiki_pages").findOne({_id})
        if(!wikiPage) throw new Error("Failed to find wiki page")
        //first remove all the old nodes as they will be out of sync with the new page data... 
        const removeOldNodes = await db.collection("wiki_nodes").deleteMany({wiki_title: wikiPage.title})
        console.log(`Removed ${removeOldNodes.deletedCount} 'stale' wiki nodes`)
    
        const newEmbeddings = await getEmbeddings(newText,EMBED_TOKEN_PER_WINDOW)
        for(let i = 0; i < newEmbeddings.length; i++)
            newEmbeddings[i]['wiki_title'] = wikiPage.title

        const newAverage = getAverageEmbedding(newEmbeddings)
    
        const {acknowledged, insertedCount} = await db.collection("wiki_nodes").insertMany(newEmbeddings);
        if(!acknowledged) throw new Error("Couldn't insert new wiki nodes...")
        console.log(`Inserted ${insertedCount} new wiki nodes on update...`)
        
        const updatePage = await db.collection("wiki_pages").updateOne({_id},{
            $set: { text: newText , document_embedding: newAverage }
        })
        if(!updatePage.acknowledged) throw new Error("Couldn't update wiki page")
        return { success: true, message: `Successfully updated wiki page text and fixed nodes.`}
    } catch (error) {
        console.warn("Failure in updateWikiPageText")
        console.error(error)
        return { success: false, message: error.message || error || "Unknown Error"} ;
    }
}