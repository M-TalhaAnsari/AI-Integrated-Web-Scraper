import { Router } from 'express';
import { scrapeWebsite } from '../services/scraper.js';
import { chunkText, getEmbedding, vectorStore } from '../services/rag.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !url.startsWith('http')) {
      return res.status(400).json({ error: 'Please provide a valid website URL starting with http:// or https://' });
    }

    console.log(`[Scraper] Scraping: ${url}`);
    const scrapedData = await scrapeWebsite(url);

    // Build RAG Chunks
    const chunks = chunkText(scrapedData.fullText);
    console.log(`[RAG] Created ${chunks.length} chunks from scraped content`);

    // Generate embeddings if GEMINI_API_KEY is configured
    const apiKey = process.env.GEMINI_API_KEY;
    const embeddings = [];

    if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
      try {
        console.log('[RAG] Generating embeddings with Gemini text-embedding-004...');
        for (const chunk of chunks.slice(0, 20)) { // Index up to 20 top chunks for fast response & quota safety
          const emb = await getEmbedding(chunk.text, apiKey);
          embeddings.push(emb);
        }
      } catch (embErr) {
        console.warn('[RAG] Embedding generation warning:', embErr.message);
      }
    }

    // Save chunks to in-memory vector store
    vectorStore.setDocuments(chunks.slice(0, 20), embeddings, url, scrapedData.title);

    res.json({
      success: true,
      data: {
        ...scrapedData,
        chunksCreated: chunks.length,
        indexedChunks: Math.min(chunks.length, 20)
      }
    });
  } catch (error) {
    console.error('[Scraper Error]:', error.message);
    res.status(500).json({
      error: 'Failed to scrape website: ' + (error.response?.statusText || error.message)
    });
  }
});

export default router;
