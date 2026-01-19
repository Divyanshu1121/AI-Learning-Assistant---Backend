const express = require("express");
const protect = require("../middleware/auth");
const { generateFlashcards, getFlashcardsByDocument, clearFlashcards }
    = require("../controllers/flashcardController");
const router = express.Router();

router.post("/:documentId", protect, generateFlashcards);
router.get("/:documentId", protect, getFlashcardsByDocument);
router.delete("/:documentId", protect, clearFlashcards);

module.exports = router;