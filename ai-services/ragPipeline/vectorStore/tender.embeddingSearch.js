const { getVectorStore } = require("./tender.embeddingStore");

async function searchTenderEmbeddings(tenderId, query, limit = 5) {
  const store = await getVectorStore();

  const results = await store.similaritySearchWithScore(
    query,
    limit,
    {
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
  searchTenderEmbeddings,
};