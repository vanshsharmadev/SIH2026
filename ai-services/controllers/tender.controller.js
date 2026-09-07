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
      // pdfUrl,
      publicId
    } = req.body;

    if (!tenderId) {
      return res.status(400).json({
        success: false,
        message: "tenderId is required"
      });
    }

    // if (!pdfUrl) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "pdfUrl is required"
    //   });
    // }

    // // Download PDF
    // const filePath = await downloadPdf(
    //   pdfUrl,
    //   tenderId
    // );


    const filePath = path.join(
      __dirname,
       "../test-data/test-tender.pdf"
    );

    console.log(
      `Using local tender PDF: ${filePath}`
    );


    // Parse → chunk → embed
    const result = await processTender(
      tenderId,
      filePath
    );

    // Save generated embeddings
    const saved = await saveTenderEmbeddings(
      result.tenderId,
      result.chunks
    );

    return res.status(200).json({
      success: true,
      message: "Tender processed successfully",

      data: {
        tenderId,
        title,
        publicId,
        totalChunks: result.totalChunks,
        savedChunks: saved.savedChunks
      }
    });

  } catch (error) {

    console.error(
      "Tender processing failed:",
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