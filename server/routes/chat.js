import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { getEmbedding, vectorStore } from '../services/rag.js';

const router = Router();

// Helper: Call Gemini
async function callGemini(prompt, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// Helper: Call Groq Fallback (LLaMA 3.3 70B)
async function callGroq(prompt, groqApiKey) {
  const groq = new Groq({ apiKey: groqApiKey });
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are a professional, helpful, and concise AI assistant for a web scraping application.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.5
  });
  return completion.choices[0]?.message?.content || 'No response generated.';
}

router.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    const hasGeminiKey = geminiKey && geminiKey !== 'YOUR_GEMINI_API_KEY_HERE';
    const hasGroqKey = groqKey && groqKey !== 'YOUR_GROQ_API_KEY_HERE';

    if (!hasGeminiKey && !hasGroqKey) {
      return res.json({
        reply: `⚠️ **API Key Missing:** Please add your **GEMINI_API_KEY** or **GROQ_API_KEY** in \`server/.env\` to activate AI responses!`,
        sourcesUsed: false,
        modelUsed: 'None'
      });
    }

    let context = '';
    let sourcesUsed = false;
    let queryEmbedding = null;

    // 1. Try to compute query embedding if Gemini key is present
    if (hasGeminiKey && vectorStore.documents.length > 0) {
      queryEmbedding = await getEmbedding(message, geminiKey);
    }

    // 2. Retrieve top matching chunks (hybrid search: vector or keyword)
    if (vectorStore.documents.length > 0) {
      const relevantChunks = vectorStore.search(message, queryEmbedding, 4);
      if (relevantChunks.length > 0 && relevantChunks[0].score > 0) {
        context = relevantChunks
          .map((c, i) => `[Snippet ${i + 1} | Source: "${c.sourceTitle}"]:\n${c.text}`)
          .join('\n\n');
        sourcesUsed = true;
      }
    }

    // 3. Construct prompt
    let prompt;
    const activeSources = vectorStore.getSources();
    if (sourcesUsed && context) {
      prompt = `You are an AI assistant answering questions about the following scraped web content.
Indexed Sources (${activeSources.length}):
${activeSources.map(s => `- ${s.title} (${s.url})`).join('\n')}

RELEVANT SCRAPED CONTEXT:
${context}

USER QUESTION:
${message}

Instructions:
1. Ground your answer in the scraped context above.
2. If the user asks a question not in the scraped text, answer politely using general knowledge and clarify that it was not found in the scraped pages.
3. Keep the answer clear, structured, and easy to read.`;
    } else {
      prompt = `You are a helpful AI assistant in a Web Scraping application.
User Question: ${message}

Please provide an accurate, clear, and human-like answer.`;
    }

    let reply = '';
    let modelUsed = '';
    let usedFallback = false;

    // 4. Try Gemini first
    if (hasGeminiKey) {
      try {
        reply = await callGemini(prompt, geminiKey);
        modelUsed = 'Gemini 1.5 Flash';
      } catch (geminiErr) {
        console.warn('[Gemini Failed, triggering Groq fallback]:', geminiErr.message);
        usedFallback = true;
      }
    }

    // 5. Fallback to Groq if Gemini failed or wasn't provided
    if (!reply && hasGroqKey) {
      try {
        reply = await callGroq(prompt, groqKey);
        modelUsed = usedFallback
          ? 'Groq LLaMA 3.3 (Fallback from Gemini)'
          : 'Groq LLaMA 3.3';
      } catch (groqErr) {
        console.error('[Groq Error]:', groqErr.message);
      }
    }

    // 6. Handle case where both attempted models failed
    if (!reply) {
      return res.status(500).json({
        error: 'Both Gemini and Groq AI requests failed. Please check your API keys or rate limits in server/.env.'
      });
    }

    res.json({
      reply,
      sourcesUsed,
      modelUsed,
      activeSourcesCount: activeSources.length
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
