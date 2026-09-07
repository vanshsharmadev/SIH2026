const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function storeBidderEmbeddings(processedDocument) {
  const { tenderId, bidderId, documentId, documentType, chunks } = processedDocument;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const chunk of chunks) {
      await client.query(
        `INSERT INTO bidder_embeddings 
          (tender_id, bidder_id, document_id, document_type, chunk_index, content, embedding)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (document_id, chunk_index) 
         DO UPDATE SET content = EXCLUDED.content, embedding = EXCLUDED.embedding`,
        [
          tenderId,
          bidderId,
          documentId,
          documentType,
          chunk.chunkIndex,
          chunk.content,
          `[${chunk.embedding.join(",")}]`, // pgvector expects string format
        ]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return { tenderId, bidderId, documentId, insertedChunks: chunks.length };
}

module.exports = { storeBidderEmbeddings, pool };