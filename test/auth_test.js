import { hashString , validateHash } from "../utils/pwHasher.js";
async function testHasher(){
    console.log("Testing 'hashString' and 'validateHash'")
    const plaintext = "Hello Password Hasher!"
    const q = [] 
    for(let i = 0; i < 10; i++){
        q.push(
            hashString(plaintext)
        )
    }
    const hashes = await Promise.all(q)
    let allUnique = true
    for(let i = 0; i < hashes.length; i++){
        for(let j = 0; j < hashes.length; j++){
            if(i === j) continue
            if(hashes[i] === hashes[j]){ allUnique = false; break;}
        }
        if(!allUnique) break
        const isValid = await validateHash(plaintext,hashes[i])
        console.log( `[${i+1}] Validates Properly? `, isValid)
        console.assert(isValid)
    }

    console.log("Unique Hash Each Time?", allUnique)
    console.assert(allUnique)


}


testHasher()