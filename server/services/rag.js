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
  if (!a || !b || !a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// 3. Fallback keyword similarity for when embeddings are unavailable
function keywordSimilarity(query, text) {
  const qWords = query.toLowerCase().match(/\b\w{3,}\b/g) || [];
  if (qWords.length === 0) return 0;
  const tLower = text.toLowerCase();
  let matches = 0;
  for (const word of qWords) {
    if (tLower.includes(word)) matches++;
  }
  return matches / qWords.length;
}

// 4. In-memory Vector Store supporting Multi-source Scraping & Hybrid Retrieval
class VectorStore {
  constructor() {
    this.documents = []; // array of { id, text, embedding, sourceUrl, sourceTitle }
    this.sources = [];   // array of { url, title, chunkCount, date }
  }

  addDocuments(chunks, embeddings, url, title, mode = 'replace') {
    if (mode === 'replace') {
      this.documents = [];
      this.sources = [];
    }

    // Avoid duplicate chunks if the same URL is scraped again in append mode
    this.documents = this.documents.filter(doc => doc.sourceUrl !== url);
    this.sources = this.sources.filter(s => s.url !== url);

    const newDocs = chunks.map((chunk, i) => ({
      id: `${url}#${chunk.id}`,
      text: chunk.text,
      embedding: (embeddings && embeddings[i]) ? embeddings[i] : null,
      sourceUrl: url,
      sourceTitle: title
    }));

    this.documents.push(...newDocs);
    this.sources.push({
      url,
      title,
      chunkCount: chunks.length,
      indexedAt: new Date().toLocaleTimeString()
    });
  }

  // Find top K most relevant chunks (hybrid: cosine similarity if embedding available, else keyword match)
  search(query, queryEmbedding = null, topK = 4) {
    if (this.documents.length === 0) return [];

    const scored = this.documents.map(doc => {
      let score = 0;
      if (queryEmbedding && doc.embedding && queryEmbedding.length === doc.embedding.length) {
        score = cosineSimilarity(queryEmbedding, doc.embedding);
      } else {
        score = keywordSimilarity(query, doc.text);
      }
      return {
        text: doc.text,
        score,
        sourceUrl: doc.sourceUrl,
        sourceTitle: doc.sourceTitle
      };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  getSources() {
    return this.sources;
  }

  clear() {
    this.documents = [];
    this.sources = [];
  }
}

export const vectorStore = new VectorStore();

// 5. Generate embeddings using Gemini API (safe wrapper)
export async function getEmbedding(text, apiKey) {
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    return null;
  }
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (err) {
    console.warn('[Embedding Error]:', err.message);
    return null;
  }
}
