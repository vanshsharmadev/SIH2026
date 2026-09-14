const { searchTenderEmbeddings } = require(
    "../vectorStore/tender.embeddingSearch"
  );
  
  const { searchBidderEmbeddings } = require(
    "../vectorStore/bidder.embeddingSearch"
  );
  
  const { searchSummaryEmbeddings } = require(
    "../vectorStore/summary.embeddingSearch"
  );
  
  
  async function retrieveComparisonContext({
    tenderId,
    bidderIds,
    query,
    limit = 5,
  }) {
    if (!tenderId) {
      throw new Error("tenderId is required");
    }
  
    if (!Array.isArray(bidderIds) || bidderIds.length === 0) {
      throw new Error("bidderIds are required");
    }
  
    if (!query || !query.trim()) {
      throw new Error("query is required");
    }
  
    // Retrieve tender requirements once
    const tenderResults = await searchTenderEmbeddings(
      tenderId,
      query,
      limit
    );
  
    // Retrieve evidence separately for every bidder
    const bidderContexts = await Promise.all(
      bidderIds.map(async (bidderId) => {
        const [bidderResults, summaryResults] =
          await Promise.all([
            searchBidderEmbeddings(
              tenderId,
              bidderId,
              query,
              limit
            ),
  
            searchSummaryEmbeddings(
              tenderId,
              bidderId,
              query,
              limit
            ),
          ]);
  
        return {
          bidderId,
          bidderResults,
          summaryResults,
        };
      })
    );
  
    return {
      tenderResults,
      bidderContexts,
    };
  }
  
  
  module.exports = {
    retrieveComparisonContext,
  };