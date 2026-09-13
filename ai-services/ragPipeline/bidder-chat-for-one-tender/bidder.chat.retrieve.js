const { searchTenderEmbeddings } = require("../vectorStore/tender.embeddingSearch");

async function retrieveBidderTenderContext(
  tenderId,
  query,
  limit = 5
) {
  const [tenderResults, bidderResults, summaryResults] =
    await Promise.all([
      searchTenderEmbeddings(tenderId, query, limit),
    ]);

  return {
    tenderResults
  };
}

module.exports = {
  retrieveBidderTenderContext,
};