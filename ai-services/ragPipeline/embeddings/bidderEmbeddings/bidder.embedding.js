const { generateEmbedding } = require("../embedding.service");
const { extractBidderText } = require("./bidder.parser");
const { chunkBidderText } = require("./bidder.chunker");

async function processBidderDocument({
  tenderId,
  bidderId,
  documentId,
  documentType,
  filePath,
}) {
  if (!tenderId) {
    throw new Error("tenderId is required");
  }

  if (!bidderId) {
    throw new Error("bidderId is required");
  }

  if (!documentId) {
    throw new Error("documentId is required");
  }

  if (!documentType) {
    throw new Error("documentType is required");
  }

  if (!filePath) {
    throw new Error("Bidder PDF file is required");
  }

  // 1. Extract text
  const text = await extractBidderText(filePath);

  // 2. Chunk text
  const chunks = chunkBidderText(text);

  // 3. Generate embeddings
  const embeddedChunks = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    const embedding = await generateEmbedding(chunk);

    embeddedChunks.push({
      tenderId,
      bidderId,
      documentId,
      documentType,
      chunkIndex: i,
      content: chunk,
      embedding,
    });
  }

  return {
    tenderId,
    bidderId,
    documentId,
    documentType,
    totalChunks: embeddedChunks.length,
    chunks: embeddedChunks,
  };
}

module.exports = {
  processBidderDocument,
};
