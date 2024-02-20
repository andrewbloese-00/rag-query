import jwt from "jsonwebtoken"
import { JWT_SECRET } from '../env.js'

const SomeError = ( err ) => err.message || err || "Unknown Error"

export function createUserToken(userIdString){
    try {
        const token = jwt.sign({_id: userIdString}, JWT_SECRET)
        return token   
    } catch (error) {
        console.warn("failed to mint user jwt")
        console.error(error)
        return ""
    }
}

export function checkUserToken(token){
    try {
        const {_id} = jwt.verify(token,JWT_SECRET);
        return { _id, error: null};
    } catch (error) {
        console.warn("failed to check jwt")
        console.error(error)
        return { error: SomeError(error) , _id: null}
        
    }



}