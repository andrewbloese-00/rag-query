import { openai } from "./openai"

/**
 * 
 * @param {string} queryString the users query to the system
 * @param {string[]} tags an optional list of 'tags' or keywords to give further context to the query 
 */
export async function enrichQuery(queryString,tags=[]){
    try {
        const {choices} = await openai.chat.completions.create({
            messages: [
                {role: "system", content: "You are to enrich the user's search queries for use with embedding search. Make sure to emphasize key topics and potentially relavent topics to the query."},
                {role: "user", content: `USER QUERY = {${queryString}} ${tags.length > 0 ? `TAGS = {${tags.join(" ")}}`: ""}`}
            ]
        })
        return { 
            query: choices[0].message.content,
            error: null
        }
    } catch (error) {
        console.warn("enrichQuery Failed");
        console.error(error);
        return { query: null , error: error.message || error || "Failed to Enrich User Query"};
    }
}
