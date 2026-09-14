const express = require("express");

const {
  processSummaryController
} = require("../controllers/summary.controller");

const router = express.Router();


// Process ML summary
router.post(
  "/process",
  processSummaryController
);


module.exports = router;