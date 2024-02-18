import {pbkdf2, randomBytes} from 'crypto';
const ITERATIONS = 1000; 
const KEY_LEN = 64;
const DIGEST = "sha512"


export async function hashString(str){
    const salt = randomBytes(16).toString("hex")
    const hash = await new Promise((resolve)=>{
        pbkdf2(str,salt,ITERATIONS,KEY_LEN,DIGEST,(err,key)=>{
            if(err) throw err
            else resolve(key.toString("hex"))
        })
    })

    return `${hash}:${salt}`


}

export async function validateHash(str,hashed){
    const [hash,salt] = hashed.split(":")
    const testHash = await new Promise((resolve)=>{
        pbkdf2(str,salt,ITERATIONS,KEY_LEN,DIGEST,(err,key)=>{
            if(err) throw err
            else resolve(key.toString("hex"))
        })
    })
    return testHash === hash
}
