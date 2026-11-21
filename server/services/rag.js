import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. Text chunking with sliding window overlap
export function chunkText(text, chunkSize = 600, overlap = 120) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 30) {
      chunks.push({ id: chunks.length, text: chunk });
    }
    if (end === text.length) break;
    start += (chunkSize - overlap);
  }

  return chunks;
}

// 2. Cosine similarity between two vector arrays
export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// 3. In-memory Vector Store
class VectorStore {
  constructor() {
    this.documents = []; // array of { id, text, embedding }
    this.sourceUrl = '';
    this.pageTitle = '';
  }

  setDocuments(chunks, embeddings, url, title) {
    this.documents = chunks.map((chunk, i) => ({
      id: chunk.id,
      text: chunk.text,
      embedding: embeddings[i] || []
    }));
    this.sourceUrl = url;
    this.pageTitle = title;
  }

  // Find top K most relevant chunks
  search(queryEmbedding, topK = 3) {
    if (this.documents.length === 0) return [];

    const scored = this.documents.map(doc => ({
      text: doc.text,
      score: cosineSimilarity(queryEmbedding, doc.embedding)
    }));

    // Sort descending by similarity score
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  clear() {
    this.documents = [];
    this.sourceUrl = '';
    this.pageTitle = '';
  }
}

export const vectorStore = new VectorStore();

// 4. Generate embeddings using Gemini API
export async function getEmbedding(text, apiKey) {
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    return null;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const result = await model.embedContent(text);
  return result.embedding.values;
}
