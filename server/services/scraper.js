import axios from 'axios';
import * as cheerio from 'cheerio';
import { cleanText } from '../utils/textCleaner.js';

export async function scrapeWebsite(url) {
  // Fetch website HTML with a standard browser User-Agent
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    timeout: 15000
  });

  const $ = cheerio.load(response.data);

  // Remove unwanted noisy elements
  $('script, style, noscript, iframe, svg, nav, footer').remove();

  // 1. Title
  const title = $('title').text().trim() || $('h1').first().text().trim() || 'No Title Found';

  // 2. Meta description
  const metaDescription = $('meta[name="description"]').attr('content') || '';

  // 3. Headings (h1, h2, h3)
  const headings = [];
  $('h1, h2, h3').each((_, el) => {
    const text = cleanText($(el).text());
    if (text.length > 2) {
      headings.push({ tag: el.tagName.toUpperCase(), text });
    }
  });

  // 4. Paragraphs
  const paragraphs = [];
  $('p').each((_, el) => {
    const text = cleanText($(el).text());
    if (text.length > 25) {
      paragraphs.push(text);
    }
  });

  // 5. Links
  const links = [];
  $('a[href]').each((_, el) => {
    const text = cleanText($(el).text());
    const href = $(el).attr('href');
    if (text && href && href.startsWith('http') && links.length < 15) {
      links.push({ text, href });
    }
  });

  // 6. Full clean text for RAG indexing
  const fullText = cleanText($('body').text());

  return {
    url,
    title,
    metaDescription,
    headings: headings.slice(0, 20),
    paragraphs: paragraphs.slice(0, 30),
    links,
    fullText,
    stats: {
      headingCount: headings.length,
      paragraphCount: paragraphs.length,
      linkCount: links.length,
      totalWords: fullText.split(' ').filter(Boolean).length
    }
  };
}
