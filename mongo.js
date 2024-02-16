import { MongoClient ,Db} from "mongodb";
import { readFileSync} from "fs"

//custom lib
import { getAverageEmbedding, getEmbeddings} from './utils/embeddings.js'
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


/**
 * @about generates text embeddings for information (calculating the average) and creates a new wiki page and nodes for the information provided in 'text' searchable via the 'title' and embedding
 * @param {string} title the title of the information being uploaded
 * @param {string} text the information text
 * @returns {Promise<{success:{wiki_id:string,subnodes:string[]}, error: null}> | Promise<{success:null, error:string}>}
 */
async function insertDocument(title,text){
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

async function testSeed(){
    const text = readFileSync("seed.txt","utf-8")
    console.time("Insert Document")
    const result = await insertDocument("Trip Reports",text)
    console.timeEnd("Insert Document")
    console.log(result)


}


testSeed()
