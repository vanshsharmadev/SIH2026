const { downloadPdf } = require("../utils/pdfDownloader");
const { processTender } = require(
  "../ragPipeline/embeddings/tendorEmbeddings/tender.embedding"
);

async function processTenderController(req, res) {
  try {
    // 1. Receive data from Spring Boot
    const {
      tenderId,
      title,
      pdfUrl,
      publicId
    } = req.body;

    // 2. Validate required fields
    if (!tenderId) {
      return res.status(400).json({
        success: false,
        message: "tenderId is required"
      });
    }

    if (!pdfUrl) {
      return res.status(400).json({
        success: false,
        message: "pdfUrl is required"
      });
    }

    // 3. Download PDF from Cloudinary
    console.log(`Downloading tender PDF: ${tenderId}`);

    const filePath = await downloadPdf(
      pdfUrl,
      tenderId
    );

    console.log(`PDF downloaded: ${filePath}`);

    // 4. Send downloaded PDF to existing RAG pipeline
    console.log(`Processing tender: ${tenderId}`);

    const result = await processTender(
      tenderId,
      filePath
    );

    // 5. Send response back to Spring Boot
    return res.status(200).json({
      success: true,
      message: "Tender processed successfully",

      data: {
        tenderId,
        title,
        publicId,
        totalChunks: result.totalChunks
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