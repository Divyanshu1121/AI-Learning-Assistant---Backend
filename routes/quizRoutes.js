const express = require("express");
const { generateQuiz, saveQuizResult, getQuizHistory } = require("../controllers/quizController");
const protect = require("../middleware/auth");

const router = express.Router();

router.post("/:id", protect, generateQuiz);
router.post("/save/result", protect, saveQuizResult);
router.get("/history/:id", protect, getQuizHistory);

module.exports = router;