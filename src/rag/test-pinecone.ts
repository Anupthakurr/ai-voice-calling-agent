import { getIndex } from './pinecone-client';

async function test() {
  const index = getIndex();
  console.log('Testing pinecone upsert...');
  try {
    const vectors = [{ id: 'test-1', values: Array(768).fill(0.1) }];
    console.log(`Vectors length: ${vectors.length}`);
    await index.upsert(vectors as any); // Wait, I will fix it right now:
    // @ts-ignore
    await index.upsert({ records: vectors });
    console.log('Upsert successful!');
  } catch (err) {
    console.error('Pinecone Error:', err);
  }
}
test();
