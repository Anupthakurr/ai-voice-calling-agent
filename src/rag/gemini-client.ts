import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';

export const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

// Use gemini-2.0-flash for general generation and embedding-001 for embeddings
export const generativeModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
export const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
