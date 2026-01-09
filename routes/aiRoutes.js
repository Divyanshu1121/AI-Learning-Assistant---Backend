const express = require("express");
const protect = require("../middleware/auth");
const { chatWithDocument } = require("../controllers/aiController");

const router = express.Router();

router.post("/chat/:id", protect, chatWithDocument);

module.exports = router;