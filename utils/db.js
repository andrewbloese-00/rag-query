import { MongoClient ,Db} from "mongodb";
import { MONGO_URL } from "../env.js";

const client = new MongoClient(MONGO_URL)

/**
 * @about if connection fails then process is exited. 
 * @returns {Db} the db connection of the mongo cluster given in env URL , only 'connects' on first call
 */
export const useMongo = async function useMongo(){
    if(!useMongo['connected']){
        try {
            await client.connect()
            useMongo['connected'] = true
        } catch (error) {
            console.error("Failed to connect to MongoDB\n",JSON.stringify(error,null,4))
            console.warn("FATAL ERROR")
            process.exit(1);
            
        }
    }
    return client.db("ragquerydb")
}

