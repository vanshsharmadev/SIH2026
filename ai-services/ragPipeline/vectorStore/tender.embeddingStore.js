const { PGVectorStore } = require("@langchain/pgvector");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");

let vectorStore = null;

async function getVectorStore() {
  if (vectorStore) {
    return vectorStore;
  }

  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: process.env.GEMINI_EMBEDDING_MODEL,
    apiKey: process.env.GEMINI_API_KEY,
  });

  vectorStore = await PGVectorStore.initialize(embeddings, {
    postgresConnectionOptions: {
      connectionString: process.env.DATABASE_URL,
    },

    tableName: "tender_embeddings",

    columns: {
      idColumnName: "id",
      vectorColumnName: "embedding",
      contentColumnName: "content",
      metadataColumnName: "metadata",
    },

    distanceStrategy: "cosine",
  });

  return vectorStore;
}

async function saveTenderEmbeddings(tenderId, chunks) {
  const store = await getVectorStore();

  const documents = chunks.map((chunk) => ({
    pageContent: chunk.text,
    metadata: {
      tenderId: tenderId,
      chunkIndex: chunk.chunkIndex,
      documentType: chunk.documentType,
    },
  }));

  await store.addDocuments(documents);

  return {
    tenderId,
    savedChunks: documents.length,
  };
}

module.exports = {
  getVectorStore,
  saveTenderEmbeddings
};