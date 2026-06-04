import { generativeModel } from './gemini-client';
import { retrieveContext } from './retriever';
import { SYSTEM_PROMPT } from './prompts';

export async function generateResponse(query: string, conversationHistory: {role: 'user'|'model', content: string}[] = []): Promise<string> {
  const context = await retrieveContext(query);
  
  const prompt = `${SYSTEM_PROMPT}\n\nHere is the retrieved context about Anup:\n${context}\n\nUser Question:\n${query}`;

  try {
    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3 }
    });

    return result.response.text() || 'Sorry, I could not generate a response.';
  } catch (error) {
    console.error('Error generating response with Gemini:', error);
    return 'Sorry, I encountered an error while generating a response.';
  }
}
