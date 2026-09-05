const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-2",
  apiKey: process.env.GEMINI_API_KEY,
});

async function generateEmbedding(text) {
  if (!text || !text.trim()) {
    throw new Error("Text is required to generate embedding");
  }

  const embedding = await embeddings.embedQuery(text);

  return embedding;
}

module.exports = {
  generateEmbedding,
};