const { getSummaryVectorStore } = require("./summary.embeddingStore");

async function searchSummaryEmbeddings(
  bidderId,
  tenderId,
  query,
  limit = 5
) {
  const store = await getSummaryVectorStore();

  const results = await store.similaritySearchWithScore(
    query,
    limit,
    {
      bidderId: bidderId,
      tenderId: tenderId,
    }
  );

  return results.map(([document, score]) => ({
    content: document.pageContent,
    metadata: document.metadata,
    score,
  }));
}

module.exports = {
  searchSummaryEmbeddings,
};