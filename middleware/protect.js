import { ObjectId } from "mongodb";
import { useMongo } from "../utils/db.js";
import { checkUserToken } from "../utils/jwtHelpers.js";
//protection middleware, restrict access to routes, and inject user data into the request context
export async function protect(req,res,next){
    try {
        if(req.headers && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")){
            const token = req.headers.authorization.split(" ").pop();
            const { _id , error } = await checkUserToken(token);
            if(error || !_id){
                return res.status(401).json({error: "Unauthorized"});
            }
            const db = await useMongo()
            const user = await db.collection("users").findOne({_id: ObjectId.createFromHexString(_id)});
            if(!user) res.status(401).json({error: "Unauthorized"});   
            
            //attach user to request context then pass to next handler
            req.user = user; 
            next();
        } else throw new Error("Invalid Headers")
    } catch (error) {
        return res.status(500).json({error: error.message||error||"Unknown Error"});
    }
}

