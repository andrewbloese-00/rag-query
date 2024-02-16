import { writeFile } from 'fs/promises'
import { transcribeAudio, transcribeVideo } from "../utils/mediaUtils.js"




const PATH_TO_AUDIO = process.argv[2]
if(!PATH_TO_AUDIO) throw new Error("Invalid usage. Provide an absolute path to an audio file to transcribe")
async function main(){
    let pass = false
    //using default preferences 
    console.time("Transcribe")
    const transcript = await transcribeAudio(PATH_TO_AUDIO,120)
    console.timeEnd("Transcribe")
    if(transcript){
        pass = true
        await writeFile(PATH_TO_AUDIO.replace(".mp3","-transcript.txt"),transcript,"utf8");
    }
    console.log("Passed: ", pass ? "y":"n" )
}
main()
