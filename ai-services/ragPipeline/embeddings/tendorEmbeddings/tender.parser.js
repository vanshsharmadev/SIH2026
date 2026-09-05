const fs = require("fs");
const pdfParse = require("pdf-parse");

async function extractTenderText(filePath) {
  if (!filePath) {
    throw new Error("PDF file path is required");
  }

  const pdfBuffer = fs.readFileSync(filePath);

  const pdfData = await pdfParse(pdfBuffer);

  if (!pdfData.text || !pdfData.text.trim()) {
    throw new Error("No text could be extracted from the PDF");
  }

  return pdfData.text.trim();
}

module.exports = {
  extractTenderText,
};