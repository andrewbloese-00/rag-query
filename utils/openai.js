import { OPENAI_KEY } from '../env'
import { OpenAI } from 'openai'

export const openai = new OpenAI({
    apiKey: OPENAI_KEY
})