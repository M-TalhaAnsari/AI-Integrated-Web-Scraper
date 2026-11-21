# 🌐 WebMind — AI-Integrated Web Scraper with RAG Chatbot

> **Course:** Web Systems and Techniques (BS-IT 4A)  
> **Institution:** Bahria University, Islamabad Campus  
> **Assignment:** Assignment 3 (CLO 3)  
> **Student Name:** Talha Ansari  

---

## 📌 Project Overview
WebMind is a full-stack web scraping and AI chatbot application. Users can enter **any website URL**, and the application:
1. **Scrapes & Extracts** structural web data (Page Title, Meta Description, Headings, Paragraphs, Links).
2. **Performs Dynamic RAG (Retrieval-Augmented Generation)**:
   - Segments the page text into overlapping semantic chunks (window size ~600 chars, 120 chars overlap).
   - Generates vector embeddings for the chunks using Google Gemini's `text-embedding-004`.
   - Stores embeddings in a high-speed in-memory vector store.
3. **Powers an Interactive AI Chatbot**:
   - Computes **cosine similarity** between the user's question and stored website chunks.
   - Retrieves the top 3 most relevant snippets as context.
   - Generates answers grounded in the scraped website content using Google Gemini (`gemini-1.5-flash`).
   - Also answers general questions politely when no context is applicable.

---

## 🛠️ Tech Stack
- **Frontend:** React.js, Vite, Axios, Custom Clean CSS (Responsive Design)
- **Backend:** Node.js, Express.js, Axios, Cheerio
- **AI & RAG:** `@google/generative-ai` (Gemini 1.5 Flash + Text Embeddings 004), In-Memory Vector Search with Cosine Similarity

---

## 📂 Project Structure
```
AI-Integrated-Web-Scraper/
├── server/
│   ├── .env.example              # Environment variables template
│   ├── server.js                 # Express server & API routes
│   ├── routes/
│   │   ├── scrape.js             # POST /api/scrape
│   │   └── chat.js               # POST /api/chat
│   ├── services/
│   │   ├── scraper.js            # Cheerio-based web parser
│   │   └── rag.js                # Text chunker, vector store & embeddings
│   └── utils/
│       └── textCleaner.js        # HTML whitespace & noise stripper
│
├── client/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx               # Main React UI (Dashboard + Chat)
│       ├── main.jsx              # React DOM entry
│       └── index.css             # Clean responsive styles
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
2. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
3. Add your free Google Gemini API key to `server/.env`:
   ```env
   PORT=5000
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   *(Get your free key from [Google AI Studio](https://aistudio.google.com/apikey))*
4. Start the backend server:
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
3. Open your browser at: `http://localhost:3000`

---

## 💡 Key Highlights to Present to Your Instructor
1. **Dynamic Website Handling:** Works on any URL without hardcoding specific tags or pages.
2. **True RAG Pipeline:** Doesn't dump the whole page into the LLM context; uses semantic chunking and vector embeddings with cosine similarity.
3. **Clean Architecture:** Separation of concerns between scraping (`scraper.js`), semantic retrieval (`rag.js`), and routing.
4. **Dual Chat Capability:** Answers questions based on extracted website data, with seamless fallback to general questions.
