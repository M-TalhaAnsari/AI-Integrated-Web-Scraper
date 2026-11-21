import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getEmbedding, vectorStore } from '../services/rag.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      return res.json({
        reply: `⚠️ **Gemini API Key Missing:** Please add your API key in \`server/.env\` (GEMINI_API_KEY=your_key) to activate the AI chatbot responses!`,
        sourcesUsed: false
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let context = '';
    let sourcesUsed = false;

    // Check if we have scraped website data in vector store
    if (vectorStore.documents.length > 0) {
      try {
        const queryEmbedding = await getEmbedding(message, apiKey);
        if (queryEmbedding) {
          const relevantChunks = vectorStore.search(queryEmbedding, 3);
          if (relevantChunks.length > 0) {
            context = relevantChunks.map((c, i) => `[Snippet ${i + 1}]: ${c.text}`).join('\n\n');
            sourcesUsed = true;
          }
        }
      } catch (err) {
        console.warn('[Chat RAG Warning]:', err.message);
      }
    }

    // Build prompt for Gemini
    let prompt;
    if (sourcesUsed && context) {
      prompt = `You are an AI assistant answering questions about a scraped website.
Website Title: ${vectorStore.pageTitle}
Website URL: ${vectorStore.sourceUrl}

Relevant Website Information (RAG Context):
${context}

User Question: ${message}

Instructions:
1. Answer the question using the relevant website information above whenever possible.
2. If the user asks a general question not found on the page, answer politely and mention it is general knowledge.
3. Keep your response concise, clear, and well formatted.`;
    } else {
      prompt = `You are a helpful and polite AI assistant for a web scraping application.
User Question: ${message}
Please provide a clear and concise answer.`;
    }

    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    res.json({
      reply,
      sourcesUsed,
      websiteTitle: vectorStore.pageTitle || null
    });
  } catch (error) {
    console.error('[Chat Error]:', error.message);
    res.status(500).json({
      error: 'AI Chat Error: ' + (error.message || 'Something went wrong')
    });
  }
});

// Clear current session endpoint
router.post('/reset', (req, res) => {
  vectorStore.clear();
  res.json({ success: true, message: 'RAG memory cleared' });
});

export default router;
