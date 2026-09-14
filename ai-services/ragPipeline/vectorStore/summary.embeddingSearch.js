const { generateEmbedding } = require("../embeddings/embedding.service");
const { pool } = require("./summary.embeddingStore");

async function searchSummaryEmbeddings(
  tenderId,
  bidderId,
  query,
  limit = 5
) {
  if (!tenderId) throw new Error("tenderId is required");
  if (!bidderId) throw new Error("bidderId is required");
  if (!query || !query.trim()) throw new Error("query is required");

  const queryEmbedding = await generateEmbedding(query);
  const vectorStr = `[${queryEmbedding.join(",")}]`;

  const params = [vectorStr, tenderId, bidderId];

  const { rows } = await pool.query(
    `SELECT
       id,
       tender_id,
       bidder_id,
       chunk_index,
       chunk_text,
       1 - (embedding::halfvec(3072) <=> $1::halfvec(3072)) AS similarity
     FROM summary_embeddings
     WHERE tender_id = $2
       AND bidder_id = $3
     ORDER BY embedding::halfvec(3072) <=> $1::halfvec(3072)
     LIMIT $4`,
    [...params, limit]
  );

  return rows.map((row) => ({
    content: row.chunk_text,
    metadata: {
      tenderId: row.tender_id,
      bidderId: row.bidder_id,
      chunkIndex: row.chunk_index,
      documentType: "ML_SUMMARY",
    },
    score: row.similarity,
  }));
}

module.exports = {
  searchSummaryEmbeddings,
};