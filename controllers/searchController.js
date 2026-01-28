const Document = require("../models/Document");
const Flashcard = require("../models/Flashcard");
const Quiz = require("../models/Quiz");

exports.globalSearch = async (req, res, next) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(200).json({
                documents: [],
                flashcards: [],
                quizzes: []
            });
        }

        const regex = new RegExp(query, 'i'); // Case-insensitive search

        // Execute queries in parallel
        const [documents, flashcards, quizzes] = await Promise.all([
            Document.find({
                $or: [
                    { title: regex },
                    { content: regex },
                    { originalName: regex }
                ],
                user: req.user.id
            }).select('title type createdAt').limit(5),

            Flashcard.find({
                topic: regex,
                user: req.user.id
            }).select('topic createdAt').limit(5),

            Quiz.find({
                topic: regex,
                user: req.user.id
            }).select('topic difficulty createdAt').limit(5)
        ]);

        res.status(200).json({
            documents,
            flashcards,
            quizzes
        });

    } catch (error) {
        next(error);
    }
};
