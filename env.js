import { config } from 'dotenv'
config()
export const MONGO_URL = process.env.MONGO_URL
export const OPENAI_KEY = process.env.OPENAI_KEY