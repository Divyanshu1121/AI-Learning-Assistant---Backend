const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const Document = require("../models/Document");
const Quiz = require("../models/Quiz");
const Groq = require("groq-sdk");

exports.generateQuiz = async (req, res, next) => {
    try {
        const { id } = req.params;

        const document = await Document.findOne({
            _id: id,
            user: req.user._id,
        });

        const { checkLimit, incrementUsage } = require("../services/subscriptionService");
        try {
            checkLimit(req.user, 'quizzes');
        } catch (e) {
            res.status(403);
            throw e;
        }

        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        const buffer = fs.readFileSync(
            path.join(__dirname, "..", document.filepath)
        );
        const pdfData = await pdfParse(buffer);
        const text = pdfData.text.slice(0, 6000);

        const groq = new Groq({
            apiKey: process.env.GROQ_API_KEY,
        });

        const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
                {
                    role: "system",
                    content: `
You are a quiz generator.

STRICT RULES:
- Output ONLY valid JSON
- NO text before or after JSON
- NO markdown
- NO explanations

JSON FORMAT:
{
  "questions": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A"
    }
  ]
}
          `,
                },
                {
                    role: "user",
                    content: text,
                },
            ],
            temperature: 0.9,
        });

        const raw = completion.choices[0].message.content;

        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error("RAW AI OUTPUT:", raw);
            throw new Error("AI response does not contain valid JSON");
        }

        const parsed = JSON.parse(jsonMatch[0]);

        if (!Array.isArray(parsed.questions)) {
            throw new Error("Invalid quiz format from AI");
        }

        const quiz = await Quiz.create({
            user: req.user._id,
            document: document._id,
            questions: parsed.questions,
        });

        await incrementUsage(req.user, 'quizzes');

        res.json({ success: true, quiz });
    } catch (error) {
        next(error);
    }
};

exports.saveQuizResult = async (req, res, next) => {
    try {
        const { quizId, score, accuracy } = req.body;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            res.status(404);
            throw new Error("Quiz not found");
        }

        quiz.score = score;
        quiz.accuracy = accuracy;
        await quiz.save();

        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};

exports.getQuizHistory = async (req, res) => {
    const quizzes = await Quiz.find({
        document: req.params.id,
        user: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(quizzes);
};
