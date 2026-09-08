const express = require("express");

const {
  bidderTenderChatController,
} = require("../controllers/chat.controller");

const router = express.Router();

router.post("/ask", bidderTenderChatController);

module.exports = router;