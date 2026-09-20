const { answerBidderQueryAboutTender } =
    require("../ragPipeline/bidder-chat-for-one-tender/bidder.chatOneTender.service.js");

async function bidderTenderChatController(req, res) {
    try {
        const {
            tenderId,
            query,
            tenderContext,
            sources,
        } = req.body;

        // -----------------------------
        // Validate request
        // -----------------------------

        const cleanTenderId = String(tenderId ?? '').trim();

        if (!cleanTenderId) {
            return res.status(400).json({
                success: false,
                message: "tenderId is required",
            });
        }

        if (!query || !String(query).trim()) {
            return res.status(400).json({
                success: false,
                message: "query is required",
            });
        }

        // -----------------------------
        // Generate answer
        // -----------------------------

        const result = await answerBidderQueryAboutTender({
            tenderId: cleanTenderId,
            query: String(query).trim(),
            tenderContext,
            sources,
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