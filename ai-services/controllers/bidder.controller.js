const { downloadPdf } = require("../utils/pdfDownloader");
const path = require("path");

const {
  processBidderDocument
} = require("../ragPipeline/embeddings/bidderEmbeddings/bidder.embedding");

const {
  storeBidderEmbeddings
} = require("../ragPipeline/vectorStore/bidder.embeddingStore");


async function processBidderController(req, res) {
  console.log("🔥 NEW BIDDER CONTROLLER LOADED");

  try {

    const {
      tenderId,
      bidderId,
      documentId,
      documentType,
    //   pdfUrl,
      publicId
    } = req.body;


    // Validate required fields

    if (!tenderId) {
      return res.status(400).json({
        success: false,
        message: "tenderId is required"
      });
    }

    if (!bidderId) {
      return res.status(400).json({
        success: false,
        message: "bidderId is required"
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

    // if (!pdfUrl) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "pdfUrl is required"
    //   });
    // }


    // Download PDF from Cloudinary

    // const filePath = await downloadPdf(
    //   pdfUrl,
    //   documentId
    // );

    // console.log(
    //   `Using bidder PDF: ${filePath}`
    // );


    const filePath = path.join(
        __dirname,
         "../test-data/test-bidder.pdf"
      );
  
      console.log(
        `Using local tender PDF: ${filePath}`
      );
  


    // PDF → Text → Chunks → Embeddings

    const result = await processBidderDocument({
      tenderId,
      bidderId,
      documentId,
      documentType,
      filePath
    });

    console.log(
      `Generated ${result.totalChunks} chunks`
    );


    // Save embeddings to PostgreSQL / pgvector

    const saved = await storeBidderEmbeddings(
      result
    );

    console.log(
      `Saved ${saved.insertedChunks} chunks`
    );


    return res.status(200).json({
      success: true,
      message: "Bidder document processed successfully",

      data: {
        tenderId,
        bidderId,
        documentId,
        documentType,
        publicId,
        totalChunks: result.totalChunks,
        savedChunks: saved.insertedChunks
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