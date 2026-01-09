const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const Document = require("../models/Document");
const Groq = require("groq-sdk");

exports.chatWithDocument = async (req, res, next) => {
    try {
        const { question } = req.body;
        const { id } = req.params;

        if (!question) {
            res.status(400);
            throw new Error("Question is required");
        }

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
                    content:
                        "Act as an AI Tutor. Answer the user's question using ONLY the provided document. Do not use introductory phrases like 'Based on the document' or 'According to the text.' Start the response immediately with the information. Organize the output into two distinct sections: '### Key Concepts' and '### Detailed Explanation.' Use bold text for technical terms and use bullet points for lists to ensure high readability. If the document does not contain the answer, simply state: 'Information not found in source.' Strictly avoid using any external knowledge.",
                    role: "user",
                    content: `DOCUMENT:\n${pdfText}\n\nQUESTION:\n${question}`,
                },
            ],
            temperature: 0.3,
        });

        const answer =
            completion.choices?.[0]?.message?.content ||
            "No answer generated";

        res.json({ answer });
    } catch (error) {
        console.error("GROQ AI ERROR:", error.message);
        next(error);
    }
};
