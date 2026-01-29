const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const Summary = require("../models/Summary");
const Document = require("../models/Document");
const Groq = require("groq-sdk");

exports.generateSummary = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { checkLimit, incrementUsage } = require("../services/subscriptionService");

        // Check limit before processing
        checkLimit(req.user, "summaries");

        const document = await Document.findOne({
            _id: id,
            user: req.user._id,
        });

        if (!document) {
            res.status(404);
            throw new Error("Document not found");
        }



        const filePath = path.join(__dirname, "..", document.filepath);
        const buffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(buffer);
        const text = pdfData.text.slice(0, 6000);

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
                {
                    role: "system",
                    content:
                        "Generate a structured study summary using clear HEADINGS and BULLET POINTS. No long paragraphs. Max 15 words per bullet. No emojis. Do not add external info.",
                },
                { role: "user", content: text },
            ],
            temperature: 0.5,
        });

        const summaryText =
            completion.choices[0].message.content || "No summary generated";

        const summary = await Summary.findOneAndUpdate(
            { document: document._id, user: req.user._id },
            { content: summaryText },
            { new: true, upsert: true }
        );

        await incrementUsage(req.user, "summaries");

        res.json({
            success: true,
            summary: summary.content,
        });
    } catch (error) {
        next(error);
    }
};

exports.getSummary = async (req, res) => {
    const summary = await Summary.findOne({
        document: req.params.id,
        user: req.user._id,
    });

    res.json({
        success: true,
        summary: summary?.content || "",
    });
};

