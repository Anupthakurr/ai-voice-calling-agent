import { Pinecone } from '@pinecone-database/pinecone';
import { env } from '../config/env';

export const pinecone = new Pinecone({
  apiKey: env.PINECONE_API_KEY,
});

export const getIndex = () => pinecone.Index(env.PINECONE_INDEX_NAME);
