import axios from 'axios';
import { embeddingModel } from './gemini-client';
import { getIndex } from './pinecone-client';
import { env } from '../config/env';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const GITHUB_USERNAME = 'Anupthakurr';

// Simple text chunker based on characters
function chunkText(text: string, maxChunkSize: number = 1500, overlap: number = 200): string[] {
  if (!text || text.trim().length === 0) return [];
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const chunk = text.slice(i, i + maxChunkSize);
    chunks.push(chunk);
    i += maxChunkSize - overlap;
  }
  return chunks;
}

async function getGithubRepos() {
  console.log(`Fetching repos for ${GITHUB_USERNAME}...`);
  try {
    const response = await axios.get(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100`);
    return response.data;
  } catch (error) {
    console.error('Error fetching GitHub repos:', error);
    return [];
  }
}

async function getRepoReadme(repoName: string) {
  try {
    const response = await axios.get(`https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/readme`, {
      headers: { Accept: 'application/vnd.github.v3.raw' }
    });
    return response.data;
  } catch (error) {
    // 404 is fine if there's no README
    return null;
  }
}

async function embedAndUpsert(chunks: string[], metadataTemplate: any) {
  const index = getIndex();
  let vectors = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (chunk.trim().length < 10) continue; // Skip too small chunks

    const embeddingResponse = await embeddingModel.embedContent(chunk);
    let embedding = embeddingResponse.embedding.values.slice(0, 1024);
    // Normalize the truncated embedding
    const magnitude = Math.sqrt(embedding.reduce((acc, val) => acc + val * val, 0));
    embedding = embedding.map(val => val / magnitude);

    const id = crypto.createHash('sha256').update(`${metadataTemplate.source}-${metadataTemplate.repo_name || 'resume'}-${i}`).digest('hex');

    vectors.push({
      id,
      values: embedding,
      metadata: {
        ...metadataTemplate,
        text: chunk,
      },
    });

    // Batch upsert every 50 vectors
    if (vectors.length === 50) {
      console.log(`Upserting 50 vectors...`);
      // @ts-ignore
      await index.upsert({ records: vectors });
      vectors = [];
    }
  }

  // Upsert remaining
  if (vectors.length > 0) {
    console.log(`Upserting remaining ${vectors.length} vectors...`);
    // @ts-ignore
    await index.upsert({ records: vectors });
  }
}

export async function ingestGithub() {
  console.log('Starting ingestion...');

  // Ingest Resume
  try {
    const resumePath = path.join(__dirname, 'resume.txt');
    if (fs.existsSync(resumePath)) {
      console.log('Processing Resume...');
      const resumeText = fs.readFileSync(resumePath, 'utf8');
      const resumeChunks = chunkText(resumeText, 800, 100);
      await embedAndUpsert(resumeChunks, {
        source: 'resume',
      });
      console.log(`  - Embedded Resume (${resumeChunks.length} chunks)`);
    } else {
      console.log('Resume file not found at', resumePath);
    }
  } catch (err) {
    console.error('Error processing resume:', err);
  }

  const repos = await getGithubRepos();
  
  for (const repo of repos) {
    console.log(`Processing repo: ${repo.name}`);
    
    // Add repo basic metadata
    const repoInfo = `
Repository: ${repo.name}
Description: ${repo.description || 'No description provided.'}
Language: ${repo.language || 'Unknown'}
URL: ${repo.html_url}
    `.trim();
    
    await embedAndUpsert([repoInfo], {
      source: 'github_meta',
      repo_name: repo.name,
      language: repo.language || 'Unknown'
    });

    // Get README
    const readme = await getRepoReadme(repo.name);
    if (readme) {
      const readmeChunks = chunkText(readme);
      await embedAndUpsert(readmeChunks, {
        source: 'github_readme',
        repo_name: repo.name,
        language: repo.language || 'Unknown'
      });
      console.log(`  - Embedded README (${readmeChunks.length} chunks)`);
    }
  }
  console.log('GitHub ingestion complete.');
}

// Allow running this script directly
if (require.main === module) {
  (async () => {
    try {
      await ingestGithub();
      console.log('Ingestion finished.');
    } catch (e) {
      console.error('Ingestion failed:', e);
    }
  })();
}
