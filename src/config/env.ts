import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // Vapi
  VAPI_API_KEY: z.string().min(1, 'VAPI_API_KEY is required'),
  VAPI_PHONE_NUMBER_ID: z.string().optional(),
  
  // Gemini
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  
  // Pinecone
  PINECONE_API_KEY: z.string().min(1, 'PINECONE_API_KEY is required'),
  PINECONE_INDEX_NAME: z.string().default('anup-persona'),
  
  // Google Calendar
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().min(1, 'GOOGLE_SERVICE_ACCOUNT_EMAIL is required'),
  GOOGLE_PRIVATE_KEY: z.string().min(1, 'GOOGLE_PRIVATE_KEY is required'),
  GOOGLE_CALENDAR_ID: z.string().min(1, 'GOOGLE_CALENDAR_ID is required'),
  
  // App
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PERSONA_NAME: z.string().default('Anup Thakur'),
  WEBHOOK_URL: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data;
