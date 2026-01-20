const express = require("express");
const { generateQuiz } = require("../controllers/quizController");
const protect = require("../middleware/auth");

const router = express.Router();

router.post("/:id", protect, generateQuiz);

module.exports = router;