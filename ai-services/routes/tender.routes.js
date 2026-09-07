const express = require("express");

const {
  processTenderController
} = require("../controllers/tender.controller");

const router = express.Router();

router.post(
  "/process",
  processTenderController
);

module.exports = router;