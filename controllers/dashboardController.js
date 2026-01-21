const Document = require("../models/Document");
const Quiz = require("../models/Quiz");
const Flashcard = require("../models/Flashcard");

exports.getDashboardStats = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const [docCount, quizCount, flashcardCount] = await Promise.all([
            Document.countDocuments({ user: userId }),
            Quiz.countDocuments({ user: userId }),
            Flashcard.countDocuments({ user: userId }),
        ]);

        const chatCount = 0;

        const recentDocs = await Document.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(3)
            .select("filename createdAt");

        const recentQuizzes = await Quiz.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(3)
            .populate("document", "filename")
            .select("score createdAt document");

        const recentFlashcards = await Flashcard.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(3)
            .populate("document", "filename")
            .select("createdAt document");

        let activities = [];

        recentDocs.forEach(doc => {
            activities.push({
                type: "document",
                text: `Uploaded document "${doc.filename}"`,
                date: doc.createdAt,
            });
        });

        recentQuizzes.forEach(quiz => {
            const docName = quiz.document ? quiz.document.filename : "a document";
            const action = quiz.score != null ? "Completed quiz for" : "Generated quiz for";
            activities.push({
                type: "quiz",
                text: `${action} "${docName}"`,
                date: quiz.createdAt,
            });
        });

        recentFlashcards.forEach(fc => {
            const docName = fc.document ? fc.document.filename : "a document";
            activities.push({
                type: "flashcard",
                text: `Generated flashcards from "${docName}"`,
                date: fc.createdAt,
            });
        });

        activities.sort((a, b) => new Date(b.date) - new Date(a.date));
        activities = activities.slice(0, 5);

        res.json({
            stats: {
                documents: docCount,
                quizzes: quizCount,
                flashcards: flashcardCount,
                chats: chatCount
            },
            activities
        });

    } catch (error) {
        next(error);
    }
};
