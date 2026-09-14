const { searchTenderEmbeddings } = require("../vectorStore/tender.embeddingSearch");
const { searchBidderEmbeddings } = require("../vectorStore/bidder.embeddingSearch");
const { searchSummaryEmbeddings } = require("../vectorStore/summary.embeddingSearch");

async function retrieveBidderTenderContext(
  tenderId,
  bidderId,
  query,
  limit = 5
) {
  const [tenderResults, bidderResults, summaryResults] =
    await Promise.all([
      searchTenderEmbeddings(tenderId, query, limit),
      searchBidderEmbeddings(tenderId, bidderId, query, limit),
      searchSummaryEmbeddings(tenderId, bidderId, query, limit),
    ]);

  return {
    tenderResults,
    bidderResults,
    summaryResults,
  };
}

module.exports = {
  retrieveBidderTenderContext,
};