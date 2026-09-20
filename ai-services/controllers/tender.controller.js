const { downloadPdf } = require("../utils/pdfDownloader");
const path = require("path");

const {
  processTender
} = require("../ragPipeline/embeddings/tendorEmbeddings/tender.embedding");

const {
  saveTenderEmbeddings
} = require("../ragPipeline/vectorStore/tender.embeddingStore");


async function processTenderController(req, res) {
  try {
    const {
      tenderId,
      title,
      pdfUrl,
      publicId,
      ocrText,
      text,
    } = req.body;

    const cleanTenderId = String(tenderId ?? '').trim();

    if (!cleanTenderId) {
      return res.status(400).json({
        success: false,
        message: "tenderId is required"
      });
    }

    const directText = (ocrText || text || '').trim();

    if (!pdfUrl && !directText) {
      return res.status(400).json({
        success: false,
        message: "Either pdfUrl or ocrText/text is required for indexing"
      });
    }

    let filePath = null;
    if (pdfUrl) {
      try {
        filePath = await downloadPdf(pdfUrl, cleanTenderId);
      } catch (dlErr) {
        console.warn(`[TENDER_INDEX] Download failed (${dlErr.message}), checking if direct text available`);
        if (!directText) throw dlErr;
      }
    }

    // Parse → chunk → embed
    const result = await processTender(
      cleanTenderId,
      filePath,
      directText || null
    );

    // Save generated embeddings
    const saved = await saveTenderEmbeddings(
      result.tenderId,
      result.chunks
    );

    console.log(`[TENDER_INDEX] Stored in pgvector for tender: ${cleanTenderId} (${saved.savedChunks} chunks)`);
    console.log(`[TENDER_INDEX] Completed for tender: ${cleanTenderId}`);

    return res.status(200).json({
      success: true,
      message: "Tender processed successfully",
      data: {
        tenderId: cleanTenderId,
        title,
        publicId,
        totalChunks: result.totalChunks,
        savedChunks: saved.savedChunks
      }
    });

  } catch (error) {
    console.error(
      "[TENDER_INDEX] Tender processing failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Tender processing failed",
      error: error.message
    });
  }
}

module.exports = {
  processTenderController
};