import fetch from "node-fetch"
import{ SentenceGrabber, windowSentences } from "./strUtils.js"
import { OPENAI_KEY } from "../env.js"

//CONSTANTS
const OPENAI_EMBEDDINGS_ENDPOINT = "https://api.openai.com/v1/embeddings"
const SMALL_EMBEDDINGS_DIM = 1536
//END CONSTANTS

//helper, makes a fetch request to get embeddings from openai api using the small embedding model (1536 dimensional)
export const embeddingFetch = (storeObject) => new Promise( (resolve)=>{
    fetch(OPENAI_EMBEDDINGS_ENDPOINT,{
        method:"POST",
        body: JSON.stringify({
            input: storeObject.text,
            model: "text-embedding-3-small"
        }),
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_KEY}`
        }
    }).then(response=>{
        if(!response.ok) return resolve({error: "Failed to get embedding from openai"})
        response.json()
            .then((completion)=>{
                storeObject.embedding = completion.data[0].embedding
                console.log("Store Object Modified? ", storeObject.embedding.length !== 0)
                resolve({success: "Wrote embedding to object"})
                
            })
            .catch(err=>{
                return resolve({error: err.message})
            })
            
    })
});

/**
 * 
 * @param {string} text any string to be embeded, will automatically break the string down into smaller "windows" to ensure token limits are not exceeded.
 * @param {number} tokensPerWindow Default 500, the approximate number of tokens per "window" of text
 * @param {number} overlap Default 2, the (prior) sentence overlap between each text window. 
 */
export async function getEmbeddings(text,tokensPerWindow=500,overlap=2){
    const sentences = SentenceGrabber.grabSentences(text)
    const embeddingWindows = windowSentences(sentences,tokensPerWindow,overlap).map(text=>({text,embedding:[]}));
    const pool = []
    let i = 0;
    for(i = 0; i < embeddingWindows.length; i++){
        pool.push(embeddingFetch(embeddingWindows[i]))
    }
    await Promise.all(pool)
    const result = [] 
    for(i = 0; i < embeddingWindows.length;i++){
        if(embeddingWindows[i].embedding.length === 0) continue
        else result.push(embeddingWindows[i])
    }
    return result;
}

//determines the cosine similarity == dot product of two open ai 'text-embedding-3-small' embeddings (1536)
export function getSmallCosineSimilarity(embedding1,embedding2){
    let dp = 0
    for(let i = 0; i < SMALL_EMBEDDINGS_DIM; i++){
        dp += embedding1[i]*embedding2[i]
    }
    return dp;
}

//used to determine the document level embedding provided its chunks embeddings. 
export function getAverageEmbedding(embeddings){    
    const dim = embeddings[0].embedding.length
    let sumVector = Array(dim).fill(0), i = 0;
    for(i = 0; i < embeddings.length; i++){
        for(let j = 0; j < dim; j++){
            if(embeddings[i].embedding.length <= j ) throw new Error("Cannot determine average of uneven length vectors");
            sumVector[j] += embeddings[i].embedding[j];
        }
    }
    for(i=0; i<sumVector.length;i++){
        sumVector[i]/=embeddings.length
    }
    return sumVector;
}

// function loadTestEmbeddings(){
//     console.time("loading embeddings...")
//     const json = readFileSync("test.json","utf-8");
//     const embeddings = JSON.parse(json);
//     console.log(embeddings.length)
//     console.timeEnd("loading embeddings...")
//     return embeddings
// }
// function TEMP_writeToFile(embeddings){
//     console.time("writing to file...")
//     writeFileSync("test2.json",JSON.stringify(embeddings,null,2),"utf-8");
//     console.timeEnd("writing to file...")
// }
