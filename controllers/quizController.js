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

        if (!document) {
            res.status(404);
            throw new Error("Document not found or unauthorized");
        }

        const existingQuiz = await Quiz.findOne({
            document: document._id
        });

        if (existingQuiz) {
            return res.json({
                success: true,
                quiz: existingQuiz,
            });
        }

        const filePath = path.join(__dirname, "..", document.filepath);
        const buffer = fs.readFileSync(filePath);
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
You are a strict JSON generator.

Return ONLY valid JSON.
DO NOT add explanations.
DO NOT use markdown.
DO NOT wrap in backticks.

Return an array of exactly 5 objects.
Each object must have:
- question (string)
- options (array of 4 strings)
- correctAnswer (string)

Example format:
[
  {
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "A"
  }
]
`,
                },
                {
                    role: "user",
                    content: text,
                },
            ],
            temperature: 0.2,
        });


        let raw = completion.choices[0].message.content.trim();

        const jsonStart = raw.indexOf("[");
        const jsonEnd = raw.lastIndexOf("]");

        if (jsonStart === -1 || jsonEnd === -1) {
            throw new Error("AI did not return JSON array");
        }

        raw = raw.slice(jsonStart, jsonEnd + 1);

        let questions;
        try {
            questions = JSON.parse(raw);
        } catch (err) {
            throw new Error("Failed to parse quiz JSON");
        }

        const quiz = await Quiz.create({
            user: req.user._id,
            document: document._id,
            questions,
        });

        res.json({
            success: true,
            quiz,
        });
    } catch (error) {
        next(error);
    }
};