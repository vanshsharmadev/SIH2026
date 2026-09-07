const express = require("express");

const {
  processBidderController
} = require("../controllers/bidder.controller");

const router = express.Router();

router.post(
  "/process",
  processBidderController
);

module.exports = router;