const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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
            chunkIndex: chunk.chunkIndex,
            documentType: chunk.documentType,
          }),
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
};