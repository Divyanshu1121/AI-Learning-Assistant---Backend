const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const Document = require("../models/Document");
const Groq = require("groq-sdk");
const ChatHistory = require("../models/ChatHistory");

exports.chatWithDocument = async (req, res, next) => {
    try {
        const { question } = req.body;
        const { id } = req.params;

        if (!question) {
            res.status(400);
            throw new Error("Question is required");
        }

        const { checkLimit } = require("../services/subscriptionService");
        checkLimit(req.user, 'chat');

        if (!process.env.GROQ_API_KEY) {
            throw new Error("GROQ_API_KEY not found in environment");
        }

        const groq = new Groq({
            apiKey: process.env.GROQ_API_KEY,
        });

        const doc = await Document.findOne({
            _id: id,
            user: req.user._id,
        });

        if (!doc) {
            res.status(404);
            throw new Error("Document not found");
        }

        const pdfPath = path.join(__dirname, "..", doc.filepath);
        const buffer = fs.readFileSync(pdfPath);
        const pdfData = await pdfParse(buffer);

        // Limit text to avoid token overflow
        const pdfText = pdfData.text.slice(0, 6000);

        // 🔥 GROQ CHAT COMPLETION
        const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
                {
                    role: "system",
                    content: `You are an expert AI Teacher.

BEHAVIOR RULES:
1. Use the provided document as your PRIMARY source, but use general domain knowledge to ELABORATE and explain concepts fully.
2. Handle greetings/small talk (e.g., "ok", "thanks") politely and briefly without searching the document.

FORMATTING RULES:
- Use clear HEADINGS for sections.
- Use BULLET POINTS for details.
- Each bullet must be CONCISE (max 15 words).
- NO emojis.
- NO long paragraphs; use structured lists.
- Avoid extra explanations outside distinct sections.`,
                },
                {
                    role: "user",
                    content: `DOCUMENT:\n${pdfText}\n\nQUESTION:\n${question}`,
                },
            ],
            temperature: 0.3,
        });


        const answer =
            completion.choices?.[0]?.message?.content ||
            "No answer generated";

        // Save chat history
        await ChatHistory.create({
            user: req.user._id,
            document: id,
            question,
            answer,
        });

        res.json({ answer });
    } catch (error) {
        console.error("GROQ AI ERROR:", error.message);
        next(error);
    }
};
