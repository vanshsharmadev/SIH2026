const {
  answerPlatformCopilotQuery,
} = require("../ragPipeline/platformCopilot/copilot.service");

async function copilotChatController(req, res) {
  try {
    const { query, context = {}, tenderId, bidderId } = req.body;

    if (!query || !String(query).trim()) {
      return res.status(400).json({
        success: false,
        message: "query is required",
      });
    }

    // Merge context with top-level tenderId/bidderId if passed
    const mergedContext = {
      ...context,
      tenderId: context.tenderId || (tenderId && tenderId !== "1" ? tenderId : null),
      bidderId: context.bidderId || (bidderId && bidderId !== "BID-007" ? bidderId : null),
    };

    const result = await answerPlatformCopilotQuery({
      query: String(query).trim(),
      context: mergedContext,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("GeM Compliflix AI Copilot chat error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to answer query with GeM Compliflix AI",
      error: error.message,
    });
  }
}

module.exports = {
  copilotChatController,
};
