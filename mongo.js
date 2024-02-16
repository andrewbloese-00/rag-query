import { MongoClient ,Db} from "mongodb";
import { readFileSync} from "fs"

//custom lib
import { getAverageEmbedding, embeddingFetch, getEmbeddings} from './utils/embeddings.js'
import { MONGO_URL } from "./env.js";


const client = new MongoClient(MONGO_URL)
//preferences
const EMBED_TOKEN_PER_WINDOW = 500
const EMBED_SENTENCE_OVERLAP = 2;

/**
 * @returns {Db} the db connection of the mongo cluster given in env URL , only 'connects' on first call
 */
const useMongo = async function useMongo(){
    if(!useMongo['connected']){
        await client.connect()
        useMongo['connected'] = true
    }
    return client.db("ragquerydb")
}


//TODO: Reformat to use a transaction maybe? 
/**
 * @about generates text embeddings for information (calculating the average) and creates a new wiki page and nodes for the information provided in 'text' searchable via the 'title' and embedding
 * @param {string} title the title of the information being uploaded
 * @param {string} text the information text
 * @returns {Promise<{success:{wiki_id:string,subnodes:string[]}, error: null}> | Promise<{success:null, error:string}>}
 */
async function insertWiki(title,text){
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
        const docData = {title, text, document_embedding} 
        const docResponse = await db.collection('wiki_pages').insertOne(docData);
        console.timeEnd("Create A New Document")
        if(!docResponse.acknowledged) return { success: null, error: "Failed to insert document: MongoError"}
        
        
        //apply titles to the embeddings for insertion as 'wiki_nodes'
        for(let i = 0; i < embeddings.length; i++) {
            embeddings[i]['wiki_title'] = title
        }

        const bulkInsert = await db.collection('wiki_nodes').insertMany(embeddings)
        if( !bulkInsert.acknowledged ) return { error: "Failed to insert wiki nodes: MongoError" }
        

        return { success: {wiki_id: docResponse.insertedId, subnodes: Array.from(Object.values(bulkInsert.insertedIds))} , error: null}


        
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
async function deleteWiki(title){
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
async function queryWikiNodes(searchText,n=10,enrichment=false){
	const db = await useMongo();
	const queryNode = { text: searchText, embedding: [] }
	const embedReply = await embeddingFetch(queryNode)
	if(embedReply.error) return []
	
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

	const result = await db.collection("wiki_nodes")
		.aggregate(aggregation).toArray();

	return { result , error: null }

}



async function testQuery(){
	console.time("queryWikiNodes")
	const result = await queryWikiNodes("magic mushrooms");
	console.timeEnd("queryWikiNodes")
	console.log(result)
	

}
testQuery();
