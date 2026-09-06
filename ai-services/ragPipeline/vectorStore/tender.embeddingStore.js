const { Pool } = require("pg");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { PGVectorStore } = require("@langchain/community/vectorstores/pgvector");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function getVectorStore() {
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "gemini-embedding-2",
    apiKey: process.env.GEMINI_API_KEY,
  });

  const store = await PGVectorStore.initialize(embeddings, {
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
  });

  return store;
}


async function saveTenderEmbeddings(tenderId, chunks) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const chunk of chunks) {
      await client.query(
        `
        INSERT INTO tender_embeddings
          (tender_id, content, embedding, metadata)
        VALUES
          ($1, $2, $3::vector, $4)
        `,
        [
          tenderId,
          chunk.text,
          JSON.stringify(chunk.embedding),
          JSON.stringify({
            tenderId: tenderId,
            chunkIndex: chunk.chunkIndex,
            documentType: chunk.documentType,
          })
        ]
      );
    }

    await client.query("COMMIT");

    return {
      tenderId,
      savedChunks: chunks.length,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  saveTenderEmbeddings,
  getVectorStore,
};