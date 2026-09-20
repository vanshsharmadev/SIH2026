const {
    generateEmbedding,
  } = require("../embedding.service.js");
  
  const {
    extractTenderText,
  } = require("./tender.parser");
  
  const {
    chunkText,
  } = require("./tender.chunker");
  
  async function processTender(tenderId, filePath, directText = null) {
    if (!tenderId) {
      throw new Error("tenderId is required");
    }
  
    console.log(`[TENDER_INDEX] Starting indexing for tender: ${tenderId}`);
  
    // 1. Extract text (from direct OCR/text feed or file)
    let text = directText;
    if (!text && filePath) {
      text = await extractTenderText(filePath);
    }
  
    if (!text || !text.trim()) {
      throw new Error("No text content could be extracted for tender indexing");
    }
  
    console.log(`[TENDER_INDEX] Extracted text (${text.length} characters)`);
  
    // 2. Split text into chunks
    const chunks = chunkText(text);
    console.log(`[TENDER_INDEX] Chunks created: ${chunks.length} chunks`);
  
    // 3. Generate embedding for every chunk
    const embeddedChunks = [];
  
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
  
      const embedding = await generateEmbedding(chunk);
  
      embeddedChunks.push({
        tenderId,
        chunkIndex: i,
        text: chunk,
        embedding,
        documentType: "TENDER",
      });
    }
  
    console.log(`[TENDER_INDEX] Embeddings created: ${embeddedChunks.length} vectors`);
  
    return {
      tenderId,
      totalChunks: embeddedChunks.length,
      chunks: embeddedChunks,
    };
  }
  
  module.exports = {
    processTender,
  };