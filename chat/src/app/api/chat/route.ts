import { GoogleGenAI } from '@google/genai';
import { Pinecone } from '@pinecone-database/pinecone';

const SYSTEM_PROMPT = `You are Anup Kumar Thakur's AI representative. You are speaking on behalf of Anup for the Scaler AI Engineer role or any other inquiry.

STRICT RULES:
1. ONLY answer based on the provided context from Anup's resume and GitHub repos.
2. If you don't know something, say "I don't have that specific information about Anup, but I'd be happy to have him follow up directly."
3. NEVER invent projects, skills, or experiences not in the context.
4. Be conversational, confident, and honest. Do NOT be robotic.
5. When asked about a specific GitHub repo, cite the technical details from the context.
6. When asked why Anup is a good fit, give specific evidence-backed examples from the context.
7. Keep responses focused and professional but personable.`;

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message?.trim()) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // Validate env vars
    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ error: 'GEMINI_API_KEY is not set', reply: '⚠️ Config error: GEMINI_API_KEY missing.' }, { status: 500 });
    }
    if (!process.env.PINECONE_API_KEY) {
      return Response.json({ error: 'PINECONE_API_KEY is not set', reply: '⚠️ Config error: PINECONE_API_KEY missing.' }, { status: 500 });
    }

    // Basic prompt injection guard
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('ignore previous instructions') || lowerMsg.includes('disregard your system prompt')) {
      return Response.json({
        reply: "I'm Anup's AI representative and I'm here to answer questions about his background and skills. What would you like to know?",
        sources: [],
      });
    }

    // Initialize the new @google/genai SDK
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

    // RAG retrieval
    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME || 'voice-rag');
    
    // Embed the query
    const embeddingResponse = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: message,
    });
    
    // The new SDK returns an array of embeddings. Get the first one.
    let queryEmbedding = embeddingResponse.embeddings![0].values!.slice(0, 1024);
    
    // Normalize to match pinecone indexing
    const magnitude = Math.sqrt(queryEmbedding.reduce((acc, val) => acc + val * val, 0));
    queryEmbedding = queryEmbedding.map(val => val / magnitude);

    const searchResults = await index.query({
      vector: queryEmbedding,
      topK: 6,
      includeMetadata: true,
    });

    const sources: string[] = [];
    let context = '';
    if (searchResults.matches && searchResults.matches.length > 0) {
      searchResults.matches.forEach((match) => {
        const meta = match.metadata as any;
        const source = meta.repo_name ? `GitHub: ${meta.repo_name}` : 'Resume';
        if (!sources.includes(source)) sources.push(source);
        context += `[${source}]: ${meta.text || ''}\n\n`;
      });
    }

    const prompt = `${SYSTEM_PROMPT}

Here is the retrieved context about Anup:
${context.trim()}

User Question: ${message}

Answer based only on the context above. Be specific and cite relevant details.`;

    // Generate response using gemini-2.5-flash
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
      }
    });

    const reply = result.text;
    return Response.json({ reply, sources });

  } catch (error: any) {
    console.error('[Chat API Error]', error);
    return Response.json({
      error: error?.message || 'Unknown error',
      reply: `⚠️ API Error: ${error?.message || 'Unknown error'}`,
      sources: [],
    }, { status: 500 });
  }
}
