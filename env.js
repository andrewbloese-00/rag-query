import { config } from 'dotenv'
config()
export const MONGO_URL = process.env.MONGO_URL
export const OPENAI_KEY = process.env.OPENAI_KEY
export const PORT = process.env.PORT || 8080
export const JWT_SECRET = process.env.JWT_SECRET