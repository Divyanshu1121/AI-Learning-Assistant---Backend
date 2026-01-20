const express = require("express");
const { generateSummary, getSummary } = require("../controllers/summaryController");
const protect = require("../middleware/auth");

const router = express.Router();

router.get("/:id", protect, getSummary);
router.post("/:id", protect, generateSummary);

module.exports = router;