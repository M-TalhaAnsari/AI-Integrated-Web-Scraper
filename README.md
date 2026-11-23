# 🌐 WebScraper — AI-Integrated Web Scraper with RAG Chatbot

> **Course:** Web Systems and Techniques (BS-IT 4A)  
> **Institution:** Bahria University, Islamabad Campus  
> **Assignment:** Assignment 3 (CLO 3)  
> **Student Name:** Talha Ansari  

---

## 📌 Project Overview
**WebScraper** is a full-stack web scraping and AI chatbot application with an adjustable split-screen workspace. Users can enter **any website URL**, and the application:
1. **Scrapes & Extracts** structural web data (Page Title, Meta Description, Headings, Paragraphs, Links).
2. **Multi-Source Scraping & RAG Accumulation:**
   - Users can click **"+ Scrape & Add"** on any extracted link to scrape sub-pages and merge them into the active RAG knowledge base.
3. **Dynamic Semantic RAG (Retrieval-Augmented Generation):**
   - Segments page text into overlapping chunks (~600 chars, 120 chars overlap).
   - Generates vector embeddings using Gemini's `text-embedding-004` (with fallback lexical search).
   - In-memory vector search with **cosine similarity** for top relevant snippet retrieval.
4. **Dual Model AI with Automatic Groq Fallback:**
   - Primary: Google Gemini (`gemini-1.5-flash`).
   - Fallback: Groq (`llama-3.3-70b-versatile`) if Gemini hits rate limits or is unavailable.
5. **Adjustable UI:**
   - Left side: Clean white background displaying extracted data.
   - Right side: Soft grey background featuring the AI Chatbot.
   - Draggable vertical divider to resize both sides dynamically.

---

## 🛠️ Tech Stack
- **Frontend:** React.js, Vite, Axios, Custom Responsive CSS with draggable split-pane
- **Backend:** Node.js, Express.js, Axios, Cheerio, Groq SDK, Google Generative AI SDK
- **AI & RAG:** Gemini 1.5 Flash, Groq LLaMA 3.3, In-Memory Vector Store with Cosine Similarity

---

## 📂 Project Structure
```
AI-Integrated-Web-Scraper/
├── server/
│   ├── .env.example              # Environment variables template (GEMINI & GROQ)
│   ├── server.js                 # Express server & API routes
│   ├── routes/
│   │   ├── scrape.js             # POST /api/scrape (replace & append modes)
│   │   └── chat.js               # POST /api/chat (Gemini with Groq fallback)
│   ├── services/
│   │   ├── scraper.js            # Cheerio-based web parser
│   │   └── rag.js                # Multi-source chunker, vector store & embeddings
│   └── utils/
│       └── textCleaner.js        # HTML whitespace & noise stripper
│
├── client/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx               # Main React UI (Adjustable Split Pane)
│       ├── main.jsx              # React DOM entry
│       └── index.css             # White (left) & Grey (right) Human-like theme
│
├── ASSIGNMENT_GUIDE.md           # Step-by-step project guide
└── README.md                     # Documentation
```

---

## 🚀 How to Run the Project

### 1. Backend Setup
1. Open a terminal in the root folder and navigate to `server/`:
   ```bash
   cd server
   ```
2. Configure environment keys in `server/.env`:
   ```env
   PORT=5000
   GEMINI_API_KEY=your_gemini_api_key_here
   GROQ_API_KEY=your_groq_api_key_here   # Optional fallback
   ```
3. Start the backend:
   ```bash
   npm run dev
   # or
   npm start
   ```
   Server will run on: `http://localhost:5000`

---

### 2. Frontend Setup
1. Open a second terminal and navigate to `client/`:
   ```bash
   cd client
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open in browser: `http://localhost:3000`

---

## 💡 Key Highlights to Present to Your Instructor
1. **Multi-Page RAG Accumulation:** Click "+ Scrape & Add" on extracted links to aggregate knowledge from multiple web pages into a single AI context.
2. **AI Fallback Resilience:** If Gemini is unreachable or rate limited, the backend seamlessly routes to Groq (LLaMA 3.3 70B).
3. **Draggable Resizable Layout:** Left pane (White, data focus) and Right pane (Grey, chat focus) with dynamic slider.
4. **Hybrid Search Pipeline:** Uses cosine vector similarity when embeddings are active, and falls back to term relevance if offline.
