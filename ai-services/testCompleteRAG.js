require("dotenv").config({ path: ".env.ai-rag" });

const { processTenderDocument } = require(
  "./ragPipeline/embeddings/tendorEmbeddings/tender.embedding.js"
);

const { retrieveRelevantChunks } = require(
  "./ragPipeline/vectorStore/tender.embeddingSearch.js"
);

const { generateAnswer } = require("./ragPipeline/generation");

async function testRAG() {
  try {
    console.log("========== RAG TEST START ==========");

    // One PDF URL only
    const pdfUrl =
      "https://res.cloudinary.com/kxp6fnkf/image/upload/v1788782726/tenders/file_uxedmg.pdf";

    const documentId = "DOC-TEST-001";

    // --------------------------------------------------
    // 1. PDF -> Text -> Chunks -> Embeddings -> Vector DB
    // --------------------------------------------------

    console.log("\n[1] Processing PDF...");

    const result = await processTenderDocument({
      documentId,
      pdfUrl,
    });

    console.log("Document processed successfully.");
    console.log("Result:", result);

    // --------------------------------------------------
    // 2. User query -> Embedding -> Relevant chunks
    // --------------------------------------------------

    const query =
      "What are the eligibility requirements for participating in this tender?";

    console.log("\n[2] Retrieving relevant chunks...");
    console.log("Query:", query);

    const chunks = await retrieveRelevantChunks({
      documentId,
      query,
      topK: 5,
    });

    console.log(`Retrieved ${chunks.length} chunks.`);

    chunks.forEach((chunk, index) => {
      console.log(`\n--- Chunk ${index + 1} ---`);
      console.log(chunk.text);
      console.log("Score:", chunk.score);
    });

    // --------------------------------------------------
    // 3. Chunks + Query -> LLM -> Answer
    // --------------------------------------------------

    console.log("\n[3] Generating answer...");

    const answer = await generateAnswer({
      query,
      chunks,
    });

    console.log("\n========== FINAL ANSWER ==========");
    console.log(answer);

    console.log("\n========== RAG TEST COMPLETE ==========");
  } catch (error) {
    console.error("\n========== RAG TEST FAILED ==========");
    console.error(error);
  }
}

testRAG();