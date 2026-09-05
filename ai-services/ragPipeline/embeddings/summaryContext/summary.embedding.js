const { generateEmbedding } = require("../embedding.service");
const { parseSummary } = require("./summary.parser");
const { chunkSummary } = require("./summary.chunker");

async function processSummary({
  tenderId,
  bidderId,
  summary,
}) {
  if (!tenderId) {
    throw new Error("tenderId is required");
  }

  if (!bidderId) {
    throw new Error("bidderId is required");
  }

  if (!summary) {
    throw new Error("ML summary is required");
  }

  // Convert ML JSON into RAG-friendly text
  const summaryText = parseSummary(summary);

  // Chunk summary
  const chunks = chunkSummary(summaryText);

  const embeddedChunks = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    const embedding = await generateEmbedding(chunk);

    embeddedChunks.push({
      tenderId,
      bidderId,
      documentId: null,
      documentType: "ML_SUMMARY",
      chunkIndex: i,
      content: chunk,
      embedding,
    });
  }

  return {
    tenderId,
    bidderId,
    documentType: "ML_SUMMARY",
    totalChunks: embeddedChunks.length,
    chunks: embeddedChunks,
  };
}

module.exports = {
  processSummary,
};