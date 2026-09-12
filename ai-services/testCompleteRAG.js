require("dotenv").config({ path: ".env" });

const fs = require("fs");
const path = require("path");

// -----------------------------
// Tender
// -----------------------------
const { processTender } = require(
  "./ragPipeline/embeddings/tendorEmbeddings/tender.embedding.js"
);

const { saveTenderEmbeddings } = require(
  "./ragPipeline/vectorStore/tender.embeddingStore.js"
);

// -----------------------------
// Bidder
// -----------------------------
const { processBidderDocument } = require(
  "./ragPipeline/embeddings/bidderEmbeddings/bidder.embedding.js"
);

const { storeBidderEmbeddings } = require(
  "./ragPipeline/vectorStore/bidder.embeddingStore.js"
);

// -----------------------------
// ML Summary
// -----------------------------
const { processSummary } = require(
  "./ragPipeline/embeddings/summaryContext/summary.embedding.js"
);

const { saveSummaryEmbeddings } = require(
  "./ragPipeline/vectorStore/summary.embeddingStore.js"
);

// -----------------------------
// Retrieval
// -----------------------------
const { retrieveBidderTenderContext } = require(
  "./ragPipeline/oneBidderOneTendor/bidderTender.retrieval.js"
);

// -----------------------------
// Gemini Chat
// -----------------------------
const { answerBidderTenderQuery } = require(
  "./ragPipeline/oneBidderOneTendor/chat.service.js"
);


async function testCompleteRAG() {
  try {
    console.log("========================================");
    console.log("      COMPLETE BIDDER-TENDER RAG TEST");
    console.log("========================================");


    // ==================================================
    // IDs
    // ==================================================

    const tenderId = "TND-TEST-001";
    const bidderId = "BIDDER-TEST-001";
    const documentId = "DOC-TEST-001";

    const documentType = "PAN_CARD";


    // ==================================================
    // LOCAL FILE PATHS
    // ==================================================

    const tenderPdfPath = path.join(
      __dirname,
      "test-data",
      "test-tender.pdf"
    );
    
    const bidderPdfPath = path.join(
      __dirname,
      "test-data",
      "test-bidder.pdf"
    );

    const mlSummaryPath = path.join(
      __dirname,
      "ml",
      `${tenderId}_${bidderId}.json`
    );


    // ==================================================
    // Check files
    // ==================================================

    if (!fs.existsSync(tenderPdfPath)) {
      throw new Error(
        `Tender PDF not found: ${tenderPdfPath}`
      );
    }

    if (!fs.existsSync(bidderPdfPath)) {
      throw new Error(
        `Bidder PDF not found: ${bidderPdfPath}`
      );
    }

    if (!fs.existsSync(mlSummaryPath)) {
      throw new Error(
        `ML summary not found: ${mlSummaryPath}`
      );
    }


    // ==================================================
    // 1. PROCESS TENDER PDF
    // ==================================================

    console.log("\n========================================");
    console.log("[1] PROCESSING TENDER PDF");
    console.log("========================================");

    console.log("File:", tenderPdfPath);

    const tenderResult = await processTender(
      tenderId,
      tenderPdfPath
    );

    console.log(
      `Tender chunks generated: ${tenderResult.totalChunks}`
    );

    const tenderSaved = await saveTenderEmbeddings(
      tenderResult.tenderId,
      tenderResult.chunks
    );

    console.log(
      `Tender chunks saved: ${tenderSaved.savedChunks}`
    );


    // ==================================================
    // 2. PROCESS BIDDER PDF
    // ==================================================

    console.log("\n========================================");
    console.log("[2] PROCESSING BIDDER PDF");
    console.log("========================================");

    console.log("File:", bidderPdfPath);

    const bidderResult = await processBidderDocument({
      tenderId,
      bidderId,
      documentId,
      documentType,
      filePath: bidderPdfPath,
    });

    console.log(
      `Bidder chunks generated: ${bidderResult.chunks.length}`
    );

    const bidderSaved = await storeBidderEmbeddings(
      bidderResult
    );

    console.log(
      `Bidder chunks saved: ${bidderSaved.insertedChunks}`
    );


    // ==================================================
    // 3. PROCESS ML SUMMARY
    // ==================================================

    console.log("\n========================================");
    console.log("[3] PROCESSING ML SUMMARY");
    console.log("========================================");

    const mlSummary = JSON.parse(
      fs.readFileSync(mlSummaryPath, "utf-8")
    );

    console.log("ML summary loaded successfully.");

    const summaryResult = await processSummary({
      tenderId,
      bidderId,
      summary: mlSummary,
    });

    console.log(
      `ML summary chunks generated: ${summaryResult.totalChunks}`
    );

    const summarySaved = await saveSummaryEmbeddings(
      summaryResult.bidderId,
      summaryResult.tenderId,
      summaryResult.chunks
    );

    console.log(
      `ML summary chunks saved: ${summarySaved.savedChunks}`
    );


    // ==================================================
    // 4. USER QUERY
    // ==================================================

    const query =
      "Why was this bidder rejected and what does the bidder need to submit to become compliant?";

    console.log("\n========================================");
    console.log("[4] USER QUERY");
    console.log("========================================");

    console.log(query);


    // ==================================================
    // 5. RETRIEVE ALL CONTEXT
    // ==================================================

    console.log("\n========================================");
    console.log("[5] RETRIEVING RAG CONTEXT");
    console.log("========================================");

    const {
      tenderResults,
      bidderResults,
      summaryResults,
    } = await retrieveBidderTenderContext(
      tenderId,
      bidderId,
      query,
      5
    );


    // -----------------------------
    // Tender results
    // -----------------------------

    console.log(
      `\nTender results: ${tenderResults.length}`
    );

    tenderResults.forEach((result, index) => {
      console.log(
        `\n--- Tender Source ${index + 1} ---`
      );

      console.log(result.content);
      console.log("Score:", result.score);
    });


    // -----------------------------
    // Bidder results
    // -----------------------------

    console.log(
      `\nBidder results: ${bidderResults.length}`
    );

    bidderResults.forEach((result, index) => {
      console.log(
        `\n--- Bidder Source ${index + 1} ---`
      );

      console.log(result.content);
      console.log("Score:", result.similarity);
    });


    // -----------------------------
    // ML Summary results
    // -----------------------------

    console.log(
      `\nML Summary results: ${summaryResults.length}`
    );

    summaryResults.forEach((result, index) => {
      console.log(
        `\n--- ML Summary Source ${index + 1} ---`
      );

      console.log(result.content);
      console.log("Score:", result.score);
    });


    // ==================================================
    // 6. SEND EVERYTHING TO GEMINI
    // ==================================================

    console.log("\n========================================");
    console.log("[6] GENERATING GEMINI ANSWER");
    console.log("========================================");

    const response = await answerBidderTenderQuery({
      tenderId,
      bidderId,
      query,
    });


    // ==================================================
    // 7. FINAL ANSWER
    // ==================================================

    console.log("\n========================================");
    console.log("             FINAL ANSWER");
    console.log("========================================");

    console.log(response.answer);


    // ==================================================
    // 8. COMPLETE
    // ==================================================

    console.log("\n========================================");
    console.log("       COMPLETE RAG TEST SUCCESSFUL");
    console.log("========================================");

  } catch (error) {

    console.error("\n========================================");
    console.error("          RAG TEST FAILED");
    console.error("========================================");

    console.error(error);

    if (error.stack) {
      console.error(error.stack);
    }
  }
}


testCompleteRAG();