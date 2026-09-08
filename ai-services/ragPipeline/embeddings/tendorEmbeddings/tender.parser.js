const fs = require("fs");
const { PDFParse } = require("pdf-parse");

async function extractTenderText(filePath) {
  if (!filePath) {
    throw new Error("PDF file path is required");
  }

  const pdfBuffer = fs.readFileSync(filePath);

  const parser = new PDFParse({
    data: pdfBuffer,
  });

  const pdfData = await parser.getText();

  await parser.destroy();

  if (!pdfData.text || !pdfData.text.trim()) {
    throw new Error("No text could be extracted from the PDF");
  }

  return pdfData.text.trim();
}

module.exports = {
  extractTenderText,
};