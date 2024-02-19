import { verify, sign } from "jsonwebtoken"
import { JWT_SECRET } from '../env.js'

const SomeError = ( err ) => err.message || err || "Unknown Error"

export async function createUserToken(userIdString){
    try {
        const token = sign({_id: userIdString}, JWT_SECRET)
        return { token , error: null}   
    } catch (error) {
        console.warn("failed to mint user jwt")
        console.error(error)
        return {error: SomeError(error)}
    }
}

export async function checkUserToken(token){
    try {
        const {_id} = verify(token);
        return { _id, error: null};
    } catch (error) {
        console.warn("failed to check jwt")
        console.error(error)
        return { error: SomeError(error) , _id: null}
        
    }



}