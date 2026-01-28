const express = require("express");
const router = express.Router();
const searchController = require("../controllers/searchController");
const protect = require("../middleware/auth");

// Protected route - only search own documents
router.get("/", protect, searchController.globalSearch);

module.exports = router;
