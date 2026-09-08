const {
    answerBidderTenderQuery,
  } = require("../ragPipeline/oneBidderOneTendor/chat.service");
  
  async function bidderTenderChatController(req, res) {
    try {
      const {
        tenderId,
        bidderId,
        query,
      } = req.body;
  
      // -----------------------------
      // Validate request
      // -----------------------------
  
      if (!tenderId) {
        return res.status(400).json({
          success: false,
          message: "tenderId is required",
        });
      }
  
      if (!bidderId) {
        return res.status(400).json({
          success: false,
          message: "bidderId is required",
        });
      }
  
      if (!query || !query.trim()) {
        return res.status(400).json({
          success: false,
          message: "query is required",
        });
      }
  
      // -----------------------------
      // Generate answer
      // -----------------------------
  
      const result = await answerBidderTenderQuery({
        tenderId,
        bidderId,
        query,
      });
  
      // -----------------------------
      // Send response
      // -----------------------------
  
      return res.status(200).json({
        success: true,
        data: result,
      });
  
    } catch (error) {
      console.error(
        "Bidder-Tender chat failed:",
        error
      );
  
      return res.status(500).json({
        success: false,
        message: "Failed to answer bidder query",
        error: error.message,
      });
    }
  }
  
  module.exports = {
    bidderTenderChatController,
  };