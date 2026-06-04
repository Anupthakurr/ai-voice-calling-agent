import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

async function checkModels() {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${env.GEMINI_API_KEY}`);
  const data = await response.json();
  const embedModels = data.models.filter((m: any) => m.supportedGenerationMethods.includes('embedContent'));
  console.log('Available embedding models:');
  embedModels.forEach((m: any) => console.log(`- ${m.name}`));
}

checkModels();
