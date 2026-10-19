const express = require("express");
const {
  copilotChatController,
} = require("../controllers/copilot.controller");

const router = express.Router();

// POST /api/ai/copilot/ask
router.post("/ask", copilotChatController);

module.exports = router;
