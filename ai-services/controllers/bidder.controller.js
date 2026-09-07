const { downloadPdf } = require("../utils/pdfDownloader");

const {
  processBidderDocument
} = require(
  "../ragPipeline/embeddings/bidderEmbeddings/bidder.embedding"
);

async function processBidderController(req, res) {
  try {

    // 1. Receive data from Spring Boot
    const {
      bidderId,
      tenderId,
      bidId,
      documentId,
      documentType,
      title,
      pdfUrl,
      publicId
    } = req.body;


    // 2. Validate required fields

    if (!bidderId) {
      return res.status(400).json({
        success: false,
        message: "bidderId is required"
      });
    }

    if (!tenderId) {
      return res.status(400).json({
        success: false,
        message: "tenderId is required"
      });
    }

    if (!bidId) {
      return res.status(400).json({
        success: false,
        message: "bidId is required"
      });
    }

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: "documentId is required"
      });
    }

    if (!documentType) {
      return res.status(400).json({
        success: false,
        message: "documentType is required"
      });
    }

    if (!pdfUrl) {
      return res.status(400).json({
        success: false,
        message: "pdfUrl is required"
      });
    }


    // 3. Download PDF from Cloudinary

    console.log(
      `Downloading bidder document: ${documentId}`
    );

    const filePath = await downloadPdf(
      pdfUrl,
      `${bidderId}-${documentId}`
    );

    console.log(
      `PDF downloaded: ${filePath}`
    );


    // 4. Send PDF to RAG pipeline

    console.log(
      `Processing bidder document: ${documentId}`
    );

    const result = await processBidderDocument({
      tenderId,
      bidderId,
      documentId,
      documentType,
      filePath
    });


    // 5. Send response to Spring Boot

    return res.status(200).json({
      success: true,
      message: "Bidder document processed successfully",

      data: {
        bidderId,
        tenderId,
        bidId,
        documentId,
        documentType,
        title,
        publicId,
        totalChunks: result.totalChunks
      }
    });

  } catch (error) {

    console.error(
      "Bidder document processing failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Bidder document processing failed",
      error: error.message
    });
  }
}

module.exports = {
  processBidderController
};