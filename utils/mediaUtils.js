import MP3Cutter from 'mp3-cutter'
import mp3Duration from 'mp3-duration'
import ffmpeg from "ffmpeg"
import { unlink } from 'fs/promises'
import { createReadStream } from 'fs'
import { OpenAI } from "openai"
import { OPENAI_KEY } from '../env.js'
/**
 * @typedef {{cleanup: "mp3" | "mp4" | "both", chunkSize: number}} VideoTranscriberOptions */

//uses api key from .env
const openai = new OpenAI({
    apiKey: OPENAI_KEY
})

//use small chunks to speed up listening 
const WHISPER_CHUNK_DURATION = 120 // 2 minute chunks
const DEFAULT_TRANSCRIBER_OPTIONS = {
	cleanup: "mp3", chunkSize: WHISPER_CHUNK_DURATION
}

/**
 * @about maintains the same file name as the soruce path just converted to mp3
 * @param {string} pathToMp4 path to the mp4 file to extract sound from
 * @param {boolean} cleanup should the source mp4 file be deleted after conversion? Default to false
 * @returns {Promise<{file:string,error:null}|{file:null,error:string}>} either an error message or the path to the mp3 file
 */
export const mp4ToMp3 = (pathToMp4,cleanup=false) => new Promise((resolve)=>{
	const destinationPath = pathToMp4.replace(".mp4",".mp3")
	new ffmpeg(pathToMp4, (error,video)=>{
		if(error){ 
			console.error(error);
			return resolve({error,file:null})
		}
		console.time(`Extract Audio to MP3 from ${pathToMp4}`)
		video.fnExtractSoundToMP3(destinationPath,(err,file)=>{
			console.timeEnd(`Extract Audio to MP3 from ${pathToMp4}`)
			if(err){
				console.warn("error in fnExtractSoundToMP3")
				console.error(err)
				return resolve({error:err,file:null})
			}  
			if(cleanup){
				console.log("Cleaning up mp4 file...")
				unlink(pathToMp4).finally(()=>{
					resolve({error: null, file})
				})
			} else { 
				resolve({error:null,file})
			}
		})		
	})
})


/**
 * @about helper: gets the duration of an audio file using promise instead of callback 
 * @param {string} pathToMp3 path of mp3 to check the duration of 
 * @returns {Promise<number>} on error returns 0, otherwise returns the length of the audio in seconds
 */
export const getDurationSeconds = pathToMp3 => new Promise((resolve)=>{
	mp3Duration(pathToMp3,(err,duration)=>{
		if(err) {
			console.warn("error in mp3Duration callback")
			console.error(err)
			resolve(0)
		} else { 
			resolve(duration)
		}
	})
}) 

/**
 * @about on Error, will return any successfully created chunks. Outputs error message to log
 * @param {string} pathToMp3 the path to the mp3 file to be 'chunked'
 * @param {number} chunkDuration the max duration (in seconds) of each chunk to be generated
 * @returns {Promise<string[]>} the successfully chunked segments of audio generated from the given mp3
 */
export async function chunkAudio(pathToMp3, chunkDuration=240 ){
	/**@type {string[]} */
	const chunks = [] 
	try {
		const duration = await getDurationSeconds(pathToMp3)
		for(let t = 0; t < duration; t+= chunkDuration){
			const id = chunks.length; //time ordered sequential ids starting at 0
			const destinationPath = pathToMp3.replace(".mp3", `-chunk-${id}.mp3`);
			MP3Cutter.cut({
				src: pathToMp3,
				target: destinationPath,
				start: t,
				end: Math.min(duration,t+chunkDuration)
			})
			chunks.push(destinationPath)
		}
		return chunks;
		
	} catch (error) {
		console.warn("Failed to 'chunkAudio'")
		console.error(error)
		return chunks;
	}
}

/**
 * 
 * @param {string} pathToMp3 
 * @param {"text"|"srt"|"vtt"|"verbose_json"} format 
 * @returns promise containing the result of calling openai api
 */
async function _transcriptionHelper(pathToMp3){
	try {
		//create form input with audio file and model 
		const res = await openai.audio.transcriptions.create({
			file: createReadStream(pathToMp3),
			model: "whisper-1",
		});
		return res.text || "";
	} catch (error) {
		console.warn("Failure in _transcriptionHelper()", pathToMp3);
		return null;
	}	
} 

/**
 * @about uses openai api to transcribe the given mp3 file. "Long files" (those exceeding 8 minutes in length) are automatically broken down into chunks and sent in parallel to be processesed. Joins text at the end in order of audio segment. 
 * @param {string} pathToMp3 path to the mp3 file to transcribe
 * @param {number} chunkSize the length of each chunk to be generated (in seconds). Default 240 (4 minutes)
 * @note chunkSize ONLY FOR INPUTS > 8minutes. Default is 240 (4 minute chunks)
 * @returns {string|null} The transcript or nothing
 */
export async function transcribeAudio(pathToMp3,chunkSize=WHISPER_CHUNK_DURATION){
	try {
		const chunks = await chunkAudio(pathToMp3,chunkSize);
		const transcriberQueue = [];
		let transcript = "";
		
		for(let i = 0; i < chunks.length; i++)
			if(chunks[i].endsWith(".mp3")) transcriberQueue.push(_transcriptionHelper(chunks[i],"text"));
		
		const settled = await Promise.allSettled(transcriberQueue)
		for(let i = 0; i < settled.length; i++){
			if(settled[i].status === "fulfilled" && settled[i].value != null){
				transcript += settled[i].value + " ";
			}
		}
		//cleanup created chunks automatically
		await Promise.allSettled(chunks.map(chunkPath=>unlink(chunkPath)));
		return transcript;
		
	} catch (error) {
		console.warn("Failed to transcribe audio");
		console.error(error);
		return null;
	}
}

/**
 * @about Options are default to cleanup: 'mp3', and chunkSize: 240 (4 minues)
 * @note cleanup is used to determine which files to remove, if you want to remove both mp3 and mp4 use "both", just mp3? use "mp3" ... 
 * @param {string} pathToMp4 the path to the mp4 file to be transcribed
 * @param {VideoTranscriberOptions} options 
 */
export async function transcribeVideo(pathToMp4,options=DEFAULT_TRANSCRIBER_OPTIONS){
	try {
		const {file,error} =  await mp4ToMp3(pathToMp4,false);
		if(error) {
			console.error(error); 
			return null;
		}
		const transcript = await transcribeAudio(file,options.chunkSize)
	
		// console.time(`${options.cleanup} cleanup`)
		if(options.cleanup === 'both') await Promise.allSettled([unlink(pathToMp4),unlink(file)])
		if(options.cleanup === "mp4" || options.cleanup) await unlink(pathToMp4);
		if(options.cleanup === "mp3" || options.cleanup) await unlink(file);
		// console.timeEnd(`${options.cleanup} cleanup`)
		return transcript;
		
	} catch (error) {
		console.error(error)
		return null
	}
}