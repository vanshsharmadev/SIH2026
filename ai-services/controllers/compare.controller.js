const { answerComparisonQuery } = require(
    "../ragPipeline/compareWithAi/compare.chat.service"
  );
  
  async function compareWithAi(req, res) {
    try {
      const {
        tenderId,
        bidderIds,
        query,
      } = req.body;
  
      if (!tenderId) {
        return res.status(400).json({
          success: false,
          message: "tenderId is required",
        });
      }
  
      if (!Array.isArray(bidderIds) || bidderIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "bidderIds are required",
        });
      }
  
      if (!query || !query.trim()) {
        return res.status(400).json({
          success: false,
          message: "query is required",
        });
      }
  
      const result = await answerComparisonQuery({
        tenderId,
        bidderIds,
        query,
      });
  
      return res.status(200).json({
        success: true,
        data: result,
      });
  
    } catch (error) {
      console.error("Compare with AI error:", error);
  
      return res.status(500).json({
        success: false,
        message: "Failed to process comparison query",
        error: error.message,
      });
    }
  }
  
  module.exports = {
    compareWithAi,
  };