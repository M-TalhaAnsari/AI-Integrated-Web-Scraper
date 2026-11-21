import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  // State for Scraping
  const [url, setUrl] = useState('https://en.wikipedia.org/wiki/Web_scraping');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState('');
  const [scrapedData, setScrapedData] = useState(null);

  // State for AI Chatbot
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your AI Web Assistant. Paste any website URL above to scrape it, and then ask me questions about its content!',
      sourcesUsed: false
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Handle Scraping
  const handleScrape = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsScraping(true);
    setScrapeError('');

    try {
      const response = await axios.post(`${API_BASE}/scrape`, { url });
      setScrapedData(response.data.data);

      // Add a notification message in chat
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `✅ Successfully scraped "${response.data.data.title}"!\nIndexed ${response.data.data.indexedChunks} text chunks into RAG memory. You can now ask me any question about this website!`,
          sourcesUsed: true
        }
      ]);
    } catch (err) {
      setScrapeError(err.response?.data?.error || err.message || 'Failed to scrape URL');
    } finally {
      setIsScraping(false);
    }
  };

  // Handle Sending Chat Message
  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isSending) return;

    // Add user message
    setMessages((prev) => [...prev, { sender: 'user', text: textToSend }]);
    setInputMessage('');
    setIsSending(true);

    try {
      const response = await axios.post(`${API_BASE}/chat`, { message: textToSend });
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: response.data.reply,
          sourcesUsed: response.data.sourcesUsed
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: '❌ Error: ' + (err.response?.data?.error || err.message || 'Could not fetch response'),
          sourcesUsed: false
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        sender: 'ai',
        text: 'Chat history cleared. You can ask me new questions!',
        sourcesUsed: false
      }
    ]);
  };

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <div>
          <h1>🌐 WebMind — AI Web Scraper</h1>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
            Bahria University • Web Systems and Techniques • Assignment 3 (CLO 3)
          </p>
        </div>
        <span className="badge">RAG Powered</span>
      </header>

      {/* URL Input Form */}
      <div className="url-card">
        <form onSubmit={handleScrape} className="url-form">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter any website URL (e.g. https://en.wikipedia.org/wiki/Web_scraping)"
            required
            className="url-input"
          />
          <button type="submit" disabled={isScraping} className="btn-primary">
            {isScraping ? 'Scraping & Indexing...' : 'Scrape Website'}
          </button>
        </form>

        {scrapeError && (
          <div className="alert alert-error" style={{ marginTop: '12px' }}>
            {scrapeError}
          </div>
        )}
      </div>

      {/* Main Grid: Scraped Info (Left) + AI Chat (Right) */}
      <div className="main-grid">
        {/* LEFT COLUMN: Extracted Data */}
        <div className="card">
          <div className="card-title">
            <span>📄 Extracted Content</span>
            {scrapedData && (
              <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>
                ● Active Website
              </span>
            )}
          </div>

          {!scrapedData ? (
            <div className="empty-state">
              <p>No website scraped yet.</p>
              <p style={{ marginTop: '6px', fontSize: '0.85rem' }}>
                Enter a URL above and click <strong>"Scrape Website"</strong> to see extracted data.
              </p>
            </div>
          ) : (
            <div className="scraped-content">
              {/* Page Title & Meta */}
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#1e3a8a', marginBottom: '6px' }}>
                  {scrapedData.title}
                </h3>
                {scrapedData.metaDescription && (
                  <p style={{ fontSize: '0.85rem', color: '#4b5563', fontStyle: 'italic' }}>
                    "{scrapedData.metaDescription}"
                  </p>
                )}
              </div>

              {/* Statistics */}
              <div className="stats-row">
                <div className="stat-box">
                  <div className="stat-value">{scrapedData.stats.paragraphCount}</div>
                  <div className="stat-label">Paragraphs</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value">{scrapedData.stats.headingCount}</div>
                  <div className="stat-label">Headings</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value">{scrapedData.indexedChunks}</div>
                  <div className="stat-label">RAG Chunks</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value">{scrapedData.stats.totalWords}</div>
                  <div className="stat-label">Words</div>
                </div>
              </div>

              {/* Headings List */}
              <div className="section-label">Page Headings</div>
              <div style={{ maxHeight: '140px', overflowY: 'auto', marginBottom: '14px' }}>
                {scrapedData.headings.map((h, i) => (
                  <div key={i} className="heading-item">
                    <span className="heading-tag">{h.tag}</span>
                    {h.text}
                  </div>
                ))}
              </div>

              {/* Content Snippets */}
              <div className="section-label">Extracted Paragraphs</div>
              <div style={{ maxHeight: '180px', overflowY: 'auto', marginBottom: '14px' }}>
                {scrapedData.paragraphs.slice(0, 5).map((p, i) => (
                  <div key={i} className="paragraph-box">
                    {p}
                  </div>
                ))}
              </div>

              {/* Extracted Links */}
              {scrapedData.links.length > 0 && (
                <>
                  <div className="section-label">Extracted Links ({scrapedData.links.length})</div>
                  <div style={{ maxHeight: '110px', overflowY: 'auto' }}>
                    {scrapedData.links.map((link, i) => (
                      <a key={i} href={link.href} target="_blank" rel="noreferrer" className="link-item">
                        🔗 {link.text}
                      </a>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: AI Chatbot */}
        <div className="card chat-card">
          <div className="card-title">
            <span>💬 AI Chatbot (RAG Assistant)</span>
            <button onClick={clearChat} className="btn-secondary">
              Clear Chat
            </button>
          </div>

          {/* Chat Messages */}
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`message-bubble ${
                  msg.sender === 'user' ? 'message-user' : 'message-ai'
                }`}
              >
                <div>{msg.text}</div>
                {msg.sender === 'ai' && (
                  <span className="message-source">
                    {msg.sourcesUsed ? '🧠 Grounded in website data' : '🌐 General knowledge'}
                  </span>
                )}
              </div>
            ))}
            {isSending && (
              <div className="message-bubble message-ai" style={{ fontStyle: 'italic' }}>
                AI is thinking...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggested Prompts */}
          {scrapedData && (
            <div className="suggested-questions">
              <button
                className="chip-btn"
                onClick={() => handleSendMessage('Can you summarize the main points of this website?')}
              >
                💡 Summarize website
              </button>
              <button
                className="chip-btn"
                onClick={() => handleSendMessage('What are the key topics discussed on this page?')}
              >
                📌 Key topics
              </button>
              <button
                className="chip-btn"
                onClick={() => handleSendMessage('Give me 3 important takeaways from this content.')}
              >
                🎯 3 Takeaways
              </button>
            </div>
          )}

          {/* Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="chat-input-bar"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask anything about the website or general questions..."
              className="chat-input"
              disabled={isSending}
            />
            <button type="submit" disabled={isSending || !inputMessage.trim()} className="btn-primary">
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
