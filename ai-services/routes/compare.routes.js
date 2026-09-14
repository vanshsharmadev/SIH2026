const express = require("express");

const {
  compareWithAi,
} = require("../controllers/compare.controller");

const router = express.Router();

router.post("/chat", compareWithAi);

module.exports = router;