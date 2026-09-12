const express = require("express");
const cors = require("cors");
require("dotenv").config();

const tenderRoutes = require("./routes/tender.routes");
const bidderRoutes = require("./routes/bidder.routes");
const summaryRoutes = require("./routes/summary.routes");
const bidderTenderChatRoutes = require("./routes/bidderTenderChat.routes");


const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AI RAG service is running",
  });
});

// Routes
app.use("/api/ai/tender", tenderRoutes);
app.use("/api/ai/bidder", bidderRoutes);
app.use("/api/ai/summary", summaryRoutes);
app.use(
  "/api/ai/bidder-tender-chat",
  bidderTenderChatRoutes
);


// Port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`AI RAG service running on port ${PORT}`);
});