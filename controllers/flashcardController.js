const Flashcard = require("../models/Flashcard");
const Document = require("../models/Document");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const Groq = require("groq-sdk");

exports.generateFlashcards = async (req, res, next) => {
    try {

        const doc = await Document.findOne({
            _id: req.params.documentId,
            user: req.user._id.toString(),
        });


        if (!doc) {
            res.status(404);
            return next(new Error("Document not Found or unauthorized access"));
        }

        const pdfPath = path.resolve(__dirname, "..", doc.filepath);

        if (!fs.existsSync(pdfPath)) {
            res.status(400);
            return next(new Error("Physical PDF file missing on server"));
        }

        const buffer = fs.readFileSync(pdfPath);
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
                    content: "Generate 5 flashcards. Respond ONLY with a JSON array: [{\"question\":\"...\",\"answer\":\"...\"}]",
                },
                {
                    role: "user",
                    content: text,
                },
            ],
            temperature: 0.3,
        });

        const raw = completion.choices[0].message.content;

        let parsed;
        try {
            const jsonMatch = raw.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error("No JSON array found in AI response");
            parsed = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
            console.error("AI Raw Output:", raw);
            res.status(500);
            return next(new Error("AI returned invalid data format"));
        }

        const flashcardsToInsert = parsed.map((f) => ({
            question: f.question,
            answer: f.answer,
            user: req.user._id,
            document: doc._id,
        }));

        const saved = await Flashcard.insertMany(flashcardsToInsert);

        res.json({ success: true, flashcards: saved });
    } catch (err) {
        next(err);
    }
};

exports.getFlashcardsByDocument = async (req, res, next) => {
    try {
        const flashcards = await Flashcard.find({
            document: req.params.documentId,
            user: req.user._id.toString(),
        });

        res.status(200).json({
            success: true,
            flashcards,
        });
    } catch (error) {
        next(error);
    }
};

exports.clearFlashcards = async (req, res, next) => {
    try {
        const { documentId } = req.params;

        await Flashcard.deleteMany({
            document: documentId,
            user: req.user._id.toString(),
        });

        res.status(200).json({
            success: true,
            message: "Flashcards cleared Successfully",
        });
    } catch (error) {
        next(error);
    }
};