const { Pool } = require("pg");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { PGVectorStore } = require("@langchain/pgvector");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function getSummaryVectorStore() {
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "gemini-embedding-2",
    apiKey: process.env.GEMINI_API_KEY,
  });

  const store = await PGVectorStore.initialize(embeddings, {
    postgresConnectionOptions: {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    },
    tableName: "summary_embeddings",
    columns: {
      idColumnName: "id",
      vectorColumnName: "embedding",
      contentColumnName: "chunk_text",
      metadataColumnName: "metadata",
    },
  });

  return store;
}

async function saveSummaryEmbeddings(
  bidderId,
  tenderId,
  chunks
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const chunk of chunks) {
      await client.query(
        `
        INSERT INTO summary_embeddings
          (
            bidder_id,
            tender_id,
            chunk_index,
            chunk_text,
            embedding,
            metadata
          )
        VALUES
          ($1, $2, $3, $4, $5::vector, $6)
        `,
        [
          bidderId,
          tenderId,
          chunk.chunkIndex,
          chunk.text,
          JSON.stringify(chunk.embedding),
          JSON.stringify({
            bidderId,
            tenderId,
            chunkIndex: chunk.chunkIndex,
          }),
        ]
      );
    }

    await client.query("COMMIT");

    return {
      bidderId,
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
  pool,
  saveSummaryEmbeddings,
  getSummaryVectorStore,
};