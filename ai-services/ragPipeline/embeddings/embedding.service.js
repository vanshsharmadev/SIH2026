require("dotenv").config();

const { generateEmbedding } = require("./ragPipeline/embeddings/embedding.service");

async function test() {
  try {
    const text = "Tender for supply of medical equipment";

    const embedding = await generateEmbedding(text);

    console.log("Embedding generated successfully");
    console.log("Dimensions:", embedding.length);
    console.log("First 5 values:", embedding.slice(0, 5));
  } catch (error) {
    console.error("Embedding failed:");
    console.error(error);
  }
}

test();