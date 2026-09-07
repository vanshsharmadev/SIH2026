const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

async function downloadPdf(pdfUrl, tenderId) {
  if (!pdfUrl) {
    throw new Error("PDF URL is required");
  }

  if (!tenderId) {
    throw new Error("tenderId is required");
  }

  // Create uploads directory if it doesn't exist
  const uploadDir = path.join(__dirname, "../uploads");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(
    uploadDir,
    `${tenderId}.pdf`
  );

  return new Promise((resolve, reject) => {
    const protocol = pdfUrl.startsWith("https://")
      ? https
      : http;

    const file = fs.createWriteStream(filePath);

    const request = protocol.get(pdfUrl, (response) => {

      // Handle redirects
      if (
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        file.close();

        fs.unlink(filePath, () => {});

        downloadPdf(
          response.headers.location,
          tenderId
        )
          .then(resolve)
          .catch(reject);

        return;
      }

      // Check successful response
      if (response.statusCode !== 200) {
        file.close();

        fs.unlink(filePath, () => {});

        reject(
          new Error(
            `Failed to download PDF. Status code: ${response.statusCode}`
          )
        );

        return;
      }

      // Write response to file
      response.pipe(file);

      file.on("finish", () => {
        file.close();

        resolve(filePath);
      });
    });

    request.on("error", (error) => {
      file.close();

      fs.unlink(filePath, () => {});

      reject(error);
    });
  });
}

module.exports = {
  downloadPdf
};