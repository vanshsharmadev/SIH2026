function chunkText(text, chunkSize = 1000, overlap = 200) {
    if (!text || !text.trim()) {
      throw new Error("Text is required for chunking");
    }
  
    const chunks = [];
  
    let start = 0;
  
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
  
      const chunk = text.slice(start, end).trim();
  
      if (chunk) {
        chunks.push(chunk);
      }
  
      if (end === text.length) {
        break;
      }
  
      start = end - overlap;
    }
  
    return chunks;
  }
  
  module.exports = {
    chunkText,
  };