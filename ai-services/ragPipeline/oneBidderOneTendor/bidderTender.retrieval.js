const { searchTenderEmbeddings } = require("../vectorStore/tender.embeddingSearch");
const { searchBidderEmbeddings } = require("../vectorStore/bidder.embeddingSearch");
const { searchSummaryEmbeddings } = require("../vectorStore/summary.embeddingSearch");

async function retrieveBidderTenderContext(
  tenderId,
  bidderId,
  query,
  limit = 5
) {
  let tenderResults = [];
  let bidderResults = [];
  let summaryResults = [];

  const promises = [];

  if (tenderId && tenderId !== 'general' && tenderId !== '1') {
    promises.push(
      searchTenderEmbeddings(tenderId, query, limit)
        .then((res) => {
          tenderResults = res || [];
        })
        .catch((err) => {
          console.warn("Tender embedding search skipped:", err.message);
        })
    );
  }

  if (tenderId && bidderId && tenderId !== 'general' && bidderId !== 'general' && bidderId !== 'BID-007') {
    promises.push(
      searchBidderEmbeddings(tenderId, bidderId, query, limit)
        .then((res) => {
          bidderResults = res || [];
        })
        .catch((err) => {
          console.warn("Bidder embedding search skipped:", err.message);
        })
    );

    promises.push(
      searchSummaryEmbeddings(tenderId, bidderId, query, limit)
        .then((res) => {
          summaryResults = res || [];
        })
        .catch((err) => {
          console.warn("Summary embedding search skipped:", err.message);
        })
    );
  }

  await Promise.allSettled(promises);

  return {
    tenderResults,
    bidderResults,
    summaryResults,
  };
}

module.exports = {
  retrieveBidderTenderContext,
};