import { getSentences , SentenceGrabber } from "../utils/strUtils.js"
// import {readFileSync} from 'fs'
// const text = readFileSync("test.txt","utf8")
const text = "Dr. Smith arrived at 10 a.m. to discuss the patient's MRI results. The MRI, conducted on Sept. 5, revealed no issues; however, further tests are recommended. Please schedule the tests A.S.A.P. and notify Dr. Johnson, Ph.D., about the findings. P.S. Ensure all records are updated by E.O.D. today."


function old(){
    console.time("old getSentences")
    const sentences = getSentences(text)
    console.timeEnd("old getSentences")
    console.log("Grabbed Sentences: " , sentences.length)
    console.log(sentences)
}


function proto(){
    console.time("new Extractor")
    const sentences = SentenceGrabber.grabSentences(text);
    console.timeEnd("new Extractor")
    console.log("Grabbed Sentences: ",  sentences.length)
    console.log(sentences)
}

old()
proto()