const { processBidderDocument } = require("./bidder.embedding");

async function processMultipleBidderPDFs({
  tenderId,
  bidderId,
  documents,
}) {
  if (!tenderId) {
    throw new Error("tenderId is required");
  }

  if (!bidderId) {
    throw new Error("bidderId is required");
  }

  if (!documents || documents.length === 0) {
    throw new Error("At least one bidder document is required");
  }

  const processedDocuments = [];

  for (const document of documents) {
    const result = await processBidderDocument({
      tenderId,
      bidderId,
      documentId: document.documentId,
      documentType: document.documentType,
      filePath: document.filePath,
    });

    processedDocuments.push(result);
  }

  return {
    tenderId,
    bidderId,
    totalDocuments: processedDocuments.length,
    documents: processedDocuments,
  };
}

module.exports = {
  processMultipleBidderPDFs,
};