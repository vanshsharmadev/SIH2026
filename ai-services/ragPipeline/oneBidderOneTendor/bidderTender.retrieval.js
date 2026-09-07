const { searchTenderEmbeddings } = require("../retrival/tender.retrieval");
const { searchBidderEmbeddings } = require("../retrival/bidder.retrieval");
const { searchSummaryEmbeddings } = require("../retrival/summary.retrieval");

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