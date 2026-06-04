import { embeddingModel } from './gemini-client';
import { getIndex } from './pinecone-client';

export async function retrieveContext(query: string, topK: number = 5): Promise<string> {
  const index = getIndex();
  
  // Embed the query
  const embeddingResponse = await embeddingModel.embedContent(query);
  let queryEmbedding = embeddingResponse.embedding.values.slice(0, 1024);
  const magnitude = Math.sqrt(queryEmbedding.reduce((acc, val) => acc + val * val, 0));
  queryEmbedding = queryEmbedding.map(val => val / magnitude);
  
  // Search Pinecone
  const searchResults = await index.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
  });
  
  if (!searchResults.matches || searchResults.matches.length === 0) {
    return "No specific information found in Anup's profile.";
  }
  
  // Format context
  let context = "Information about Anup Thakur based on his profile and projects:\n\n";
  searchResults.matches.forEach((match, i) => {
    const meta = match.metadata as any;
    context += `[Source: ${meta.source || 'Unknown'}, Repo: ${meta.repo_name || 'N/A'}]\n`;
    context += `${meta.text || ''}\n\n`;
  });
  
  return context.trim();
}
