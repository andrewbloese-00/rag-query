import { OPENAI_KEY } from '../env.js'
import { OpenAI } from 'openai'

export const openai = new OpenAI({
    apiKey: OPENAI_KEY
})