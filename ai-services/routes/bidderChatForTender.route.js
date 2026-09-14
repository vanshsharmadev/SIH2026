const { bidderTenderChatController } =
      require("../controllers/bidder.chatForTender.js");

const express = require("express");

const router = express.Router();

router.post("/ask", bidderTenderChatController);

module.exports = router;