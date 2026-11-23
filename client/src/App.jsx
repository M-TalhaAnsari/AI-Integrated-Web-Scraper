import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  // Resizable Split Pane State (Left side wider by default at 62%)
  const [leftWidth, setLeftWidth] = useState(62);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  // Scraping State
  const [url, setUrl] = useState('https://en.wikipedia.org/wiki/Web_scraping');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState('');
  const [scrapedData, setScrapedData] = useState(null);
  const [activeSources, setActiveSources] = useState([]);
  const [loadingLinkUrl, setLoadingLinkUrl] = useState(null);

  // Chat State
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your AI Web Assistant. Enter any website URL above to scrape it, or scrape multiple links to build a combined knowledge base for our conversation.',
      sourcesUsed: false,
      modelUsed: null
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Resizer drag handler
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      // Clamp between 35% and 75%
      if (newWidth >= 35 && newWidth <= 75) {
        setLeftWidth(newWidth);
      }
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Scraping logic (supports replace or append mode)
  const performScrape = async (targetUrl, mode = 'replace') => {
    if (!targetUrl || !targetUrl.trim()) return;

    if (mode === 'replace') {
      setIsScraping(true);
    } else {
      setLoadingLinkUrl(targetUrl);
    }
    setScrapeError('');

    try {
      const response = await axios.post(`${API_BASE}/scrape`, {
        url: targetUrl,
        mode
      });
      const data = response.data.data;

      setScrapedData(data);
      if (data.activeSources) {
        setActiveSources(data.activeSources);
      }

      // Add notification in chat
      if (mode === 'append') {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: `➕ **Added to Knowledge Base:** "${data.title}"\nNow holding ${data.totalIndexedChunks} total text chunks across ${data.activeSources?.length || 1} sources. You can ask questions covering all of them!`,
            sourcesUsed: true
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: `✅ **Indexed Website:** "${data.title}"\nReady! Ask me anything about this page or any general inquiry.`,
            sourcesUsed: true
          }
        ]);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || err.message || 'Failed to scrape website';
      setScrapeError(errorMsg);
    } finally {
      setIsScraping(false);
      setLoadingLinkUrl(null);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    performScrape(url, 'replace');
  };

  // Chat message send handler
  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isSending) return;

    setMessages((prev) => [...prev, { sender: 'user', text: textToSend }]);
    setInputMessage('');
    setIsSending(true);

    try {
      const response = await axios.post(`${API_BASE}/chat`, {
        message: textToSend
      });
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: response.data.reply,
          sourcesUsed: response.data.sourcesUsed,
          modelUsed: response.data.modelUsed
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text:
            '❌ ' +
            (err.response?.data?.error ||
              err.message ||
              'Could not connect to AI service.'),
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
        text: 'Chat history cleared. You can start a fresh conversation!',
        sourcesUsed: false
      }
    ]);
  };

  const clearAllMemory = async () => {
    try {
      await axios.post(`${API_BASE}/chat/reset`);
      setScrapedData(null);
      setActiveSources([]);
      clearChat();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="app-wrapper">
      {/* Header */}
      <header className="top-header">
        <div>
          <h1>🌐 WebScraper</h1>
          <p className="subtitle">
            Bahria University • Web Systems and Techniques • Assignment 3 (CLO 3)
          </p>
        </div>
        {activeSources.length > 0 && (
          <button onClick={clearAllMemory} className="btn-secondary">
            Reset All
          </button>
        )}
      </header>

      {/* URL Input Bar */}
      <section className="url-section">
        <form onSubmit={handleFormSubmit} className="url-form">
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

        {scrapeError && <div className="alert-box alert-danger">{scrapeError}</div>}
      </section>

      {/* Main Adjustable Split View */}
      <div
        className="workspace-split"
        ref={containerRef}
        style={{ cursor: isDragging ? 'col-resize' : 'default' }}
      >
        {/* LEFT PANE: Scraped Data (White Background, Wider by Default) */}
        <div className="left-pane" style={{ width: `${leftWidth}%` }}>
          <div className="pane-header">
            <span>📄 Scraped Content</span>
            {scrapedData && (
              <span style={{ fontSize: '0.8rem', color: '#0969da', fontWeight: 600 }}>
                ● {activeSources.length} Source{activeSources.length > 1 ? 's' : ''} in Memory
              </span>
            )}
          </div>

          {/* Active Sources Pill Bar */}
          {activeSources.length > 1 && (
            <div className="sources-bar">
              <strong>Combined Sources in RAG Memory:</strong>
              <div className="sources-list">
                {activeSources.map((s, idx) => (
                  <span key={idx} className="source-pill" title={s.url}>
                    🌐 {s.title.slice(0, 32)} ({s.chunkCount} chunks)
                  </span>
                ))}
              </div>
            </div>
          )}

          {!scrapedData ? (
            <div className="empty-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <p style={{ marginTop: '12px', fontSize: '0.95rem' }}>No website scraped yet.</p>
              <p style={{ fontSize: '0.82rem', color: '#6e7781', marginTop: '4px' }}>
                Enter a URL above and click <strong>"Scrape Website"</strong> to analyze page content.
              </p>
            </div>
          ) : (
            <div className="scraped-scroll-area">
              {/* Site Title & Description */}
              <div className="site-meta-box">
                <h2 className="site-title">{scrapedData.title}</h2>
                <a
                  href={scrapedData.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '0.82rem', color: '#0969da', textDecoration: 'none', display: 'block', marginBottom: '6px' }}
                >
                  🔗 {scrapedData.url}
                </a>
                {scrapedData.metaDescription && (
                  <p className="site-desc">"{scrapedData.metaDescription}"</p>
                )}
              </div>

              {/* Statistics Grid */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">{scrapedData.stats.paragraphCount}</div>
                  <div className="stat-title">Paragraphs</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{scrapedData.stats.headingCount}</div>
                  <div className="stat-title">Headings</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{scrapedData.indexedChunks}</div>
                  <div className="stat-title">RAG Chunks</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{scrapedData.stats.linkCount}</div>
                  <div className="stat-title">Links</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{scrapedData.stats.totalWords}</div>
                  <div className="stat-title">Words</div>
                </div>
              </div>

              {/* Extracted Headings */}
              <div className="section-title">Page Headings</div>
              <div className="headings-container">
                {scrapedData.headings.map((h, i) => (
                  <div key={i} className="heading-row">
                    <span className="heading-tag-badge">{h.tag}</span>
                    <span>{h.text}</span>
                  </div>
                ))}
              </div>

              {/* Extracted Paragraphs */}
              <div className="section-title">Extracted Paragraphs</div>
              <div>
                {scrapedData.paragraphs.slice(0, 6).map((p, i) => (
                  <div key={i} className="paragraph-entry">
                    {p}
                  </div>
                ))}
              </div>

              {/* Extracted Links + Click to Scrape & Append to RAG */}
              {scrapedData.links.length > 0 && (
                <>
                  <div className="section-title">
                    Extracted Links ({scrapedData.links.length}) — Click "+ Scrape & Add" to expand RAG
                  </div>
                  <div className="links-container">
                    {scrapedData.links.map((link, i) => {
                      const isAlreadyIndexed = activeSources.some(
                        (s) => s.url === link.href
                      );
                      const isThisLoading = loadingLinkUrl === link.href;

                      return (
                        <div key={i} className="link-row">
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noreferrer"
                            className="link-anchor"
                            title={link.href}
                          >
                            🔗 {link.text || link.href}
                          </a>
                          <button
                            onClick={() => performScrape(link.href, 'append')}
                            disabled={isThisLoading || isAlreadyIndexed}
                            className="btn-scrape-link"
                          >
                            {isThisLoading
                              ? 'Scraping...'
                              : isAlreadyIndexed
                              ? '✓ In RAG'
                              : '+ Scrape & Add'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Resizer Handle */}
        <div
          className={`split-resizer ${isDragging ? 'dragging' : ''}`}
          onMouseDown={handleMouseDown}
          title="Drag to adjust width"
        >
          <div className="split-resizer-line" />
        </div>

        {/* RIGHT PANE: Chat (Grey Background) */}
        <div
          className="right-pane"
          style={{ width: `${100 - leftWidth}%` }}
        >
          <div className="pane-header">
            <span>💬 AI Chatbot</span>
            <button onClick={clearChat} className="btn-secondary">
              Clear
            </button>
          </div>

          <div className="chat-container">
            {/* Chat Messages */}
            <div className="chat-message-list">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`chat-bubble ${
                    msg.sender === 'user' ? 'chat-user' : 'chat-ai'
                  }`}
                >
                  <div>{msg.text}</div>
                  {msg.sender === 'ai' && msg.modelUsed && (
                    <div className="chat-model-tag">
                      <span>🤖 {msg.modelUsed}</span>
                      {msg.sourcesUsed && <span>• 📚 Grounded in scraped data</span>}
                    </div>
                  )}
                </div>
              ))}
              {isSending && (
                <div className="chat-bubble chat-ai" style={{ fontStyle: 'italic', color: '#64748b' }}>
                  AI is thinking...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggested Question Chips */}
            {scrapedData && (
              <div className="chat-suggestions">
                <button
                  className="suggestion-chip"
                  onClick={() =>
                    handleSendMessage('Summarize the main content of this website.')
                  }
                >
                  💡 Summarize content
                </button>
                <button
                  className="suggestion-chip"
                  onClick={() =>
                    handleSendMessage('What are the key points and topics covered?')
                  }
                >
                  📌 Key topics
                </button>
                {activeSources.length > 1 && (
                  <button
                    className="suggestion-chip"
                    onClick={() =>
                      handleSendMessage(
                        'Compare and synthesize the information from all the scraped pages in your memory.'
                      )
                    }
                  >
                    🔄 Compare all sources
                  </button>
                )}
                <button
                  className="suggestion-chip"
                  onClick={() =>
                    handleSendMessage('List 3 interesting takeaways or facts.')
                  }
                >
                  🎯 3 Key facts
                </button>
              </div>
            )}

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="chat-input-row"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about the website or general questions..."
                className="chat-input-field"
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={isSending || !inputMessage.trim()}
                className="btn-primary"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
