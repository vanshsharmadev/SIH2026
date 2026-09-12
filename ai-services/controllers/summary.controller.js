const fs = require("fs");
const path = require("path");

const {
  processSummary
} = require("../ragPipeline/embeddings/summaryContext/summary.embedding");

const {
  saveSummaryEmbeddings
} = require("../ragPipeline/vectorStore/summary.embeddingStore");


async function processSummaryController(req, res) {

  try {

    const {
      tenderId,
      bidderId,
      summary
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

    if (!summary || typeof summary !== "object") {
      return res.status(400).json({
        success: false,
        message: "summary is required"
      });
    }


    // Create ML folder

    const mlDir = path.join(
      __dirname,
      "../ml"
    );

    if (!fs.existsSync(mlDir)) {
      fs.mkdirSync(mlDir, {
        recursive: true
      });
    }


    // Save ML summary JSON

    const filePath = path.join(
      mlDir,
      `${tenderId}_${bidderId}.json`
    );

    fs.writeFileSync(
      filePath,
      JSON.stringify(summary, null, 2),
      "utf-8"
    );


    console.log(
      `ML summary saved: ${filePath}`
    );


    // Summary → Text → Chunks → Embeddings

    const result = await processSummary({
      tenderId,
      bidderId,
      summary
    });


    console.log(
      `Generated ${result.totalChunks} summary chunks`
    );


    // Save embeddings to PostgreSQL / pgvector

    const saved = await saveSummaryEmbeddings(
        result.bidderId,
        result.tenderId,
        result.chunks
      );

    console.log(
      `Saved ${saved.insertedChunks} summary chunks`
    );


    return res.status(200).json({
      success: true,
      message: "ML summary processed successfully",

      data: {
        tenderId,
        bidderId,
        totalChunks: result.totalChunks,
        savedChunks: saved.insertedChunks
      }
    });

  } catch (error) {

    console.error(
      "ML summary processing failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "ML summary processing failed",
      error: error.message
    });
  }
}


module.exports = {
  processSummaryController
};