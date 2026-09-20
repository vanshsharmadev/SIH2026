const express = require("express");
const cors = require("cors");
require("dotenv").config();

const tenderRoutes = require("./routes/tender.routes");
const bidderRoutes = require("./routes/bidder.routes");
const summaryRoutes = require("./routes/summary.routes");
const bidderTenderChatRoutes = require("./routes/bidderTenderChat.routes");
const compareRoutes = require("./routes/compare.routes");
const bidderChatForTenderRoutes = require("./routes/bidderChatForTender.route");
const copilotRoutes = require("./routes/copilot.routes");

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
  "/api/ai/bidder-tender-chat", // for officer chat 
  bidderTenderChatRoutes
);
app.use("/api/ai/compare", compareRoutes);
app.use(
  "/api/ai/bidder-chat",
  bidderChatForTenderRoutes
);
app.use("/api/ai/copilot", copilotRoutes);


// Port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`AI RAG service running on port ${PORT}`);
});