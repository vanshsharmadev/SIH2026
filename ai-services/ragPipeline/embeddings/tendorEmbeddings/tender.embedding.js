const {
    generateEmbedding,
  } = require("../embeddings/embedding.service");
  
  const {
    extractTenderText,
  } = require("./tender.parser");
  
  const {
    chunkText,
  } = require("./tender.chunker");
  
  async function processTender(tenderId, filePath) {
    if (!tenderId) {
      throw new Error("tenderId is required");
    }
  
    if (!filePath) {
      throw new Error("Tender PDF file is required");
    }
  
    // 1. Extract PDF text
    const text = await extractTenderText(filePath);
  
    // 2. Split text into chunks
    const chunks = chunkText(text);
  
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
  
    return {
      tenderId,
      totalChunks: embeddedChunks.length,
      chunks: embeddedChunks,
    };
  }
  
  module.exports = {
    processTender,
  };