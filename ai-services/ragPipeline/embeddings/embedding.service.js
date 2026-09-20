require("dotenv").config();
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");

let embeddings = null;
function getEmbeddingsInstance() {
  if (!embeddings && (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)) {
    embeddings = new GoogleGenerativeAIEmbeddings({
      model: "gemini-embedding-2",
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
    });
  }
  return embeddings;
}

async function generateEmbedding(text) {
  if (!text || !text.trim()) {
    throw new Error("Text is required to generate embedding");
  }

  const embInstance = getEmbeddingsInstance();
  if (!embInstance) {
    console.warn("No GEMINI_API_KEY available for embedding generation, returning mock vector.");
    return new Array(768).fill(0);
  }

  const embedding = await embInstance.embedQuery(text);
  return embedding;
}

module.exports = {
  generateEmbedding,
};