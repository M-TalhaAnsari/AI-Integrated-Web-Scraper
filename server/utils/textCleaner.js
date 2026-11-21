// Utility to clean and normalize text extracted from HTML
export function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ') // collapse multiple spaces and newlines into one
    .replace(/[\r\n\t]/g, ' ')
    .trim();
}
