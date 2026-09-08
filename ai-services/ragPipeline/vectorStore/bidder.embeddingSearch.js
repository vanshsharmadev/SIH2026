const { generateEmbedding } = require("../embedding.service");
const { pool } = require("./bidder.embeddingStore");

async function searchBidderEmbeddings(
  tenderId,
  bidderId,
  query,
  limit = 5
){
  if (!tenderId) throw new Error("tenderId is required");
  if (!query) throw new Error("query is required");

  const queryEmbedding = await generateEmbedding(query);
  const vectorStr = `[${queryEmbedding.join(",")}]`;

  const params = [vectorStr, tenderId];
  let filterClause = "tender_id = $2";

  if (bidderId) {
    params.push(bidderId);
    filterClause += ` AND bidder_id = $${params.length}`;
  }

  params.push(limit);

  const { rows } = await pool.query(
    `SELECT id, tender_id, bidder_id, document_id, document_type, chunk_index, content,
            1 - (embedding::halfvec(3072) <=> $1::halfvec(3072)) AS similarity
     FROM bidder_embeddings
     WHERE ${filterClause}
     ORDER BY embedding::halfvec(3072) <=> $1::halfvec(3072)
     LIMIT $${params.length}`,
    params
  );

  return rows;
}

module.exports = { searchBidderEmbeddings };