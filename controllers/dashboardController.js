const Document = require("../models/Document");
const Quiz = require("../models/Quiz");
const Flashcard = require("../models/Flashcard");
const ChatHistory = require("../models/ChatHistory");

exports.getDashboardStats = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const [docCount, quizCount, flashcardCount, chatCount] = await Promise.all([
            Document.countDocuments({ user: userId }),
            Quiz.countDocuments({ user: userId }),
            Flashcard.countDocuments({ user: userId }),
            ChatHistory.countDocuments({ user: userId }),
        ]);

        const recentDocs = await Document.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(3)
            .select("filename createdAt thumbnail");

        const recentQuizzes = await Quiz.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(3)
            .populate("document", "filename thumbnail")
            .select("score createdAt document");

        const recentFlashcards = await Flashcard.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(3)
            .populate("document", "filename thumbnail")
            .select("createdAt document");

        let activities = [];

        recentDocs.forEach(doc => {
            activities.push({
                type: "document",
                text: `Uploaded document "${doc.filename}"`,
                date: doc.createdAt,
                thumbnail: doc.thumbnail,
            });
        });

        recentQuizzes.forEach(quiz => {
            const docName = quiz.document ? quiz.document.filename : "a document";
            const thumbnail = quiz.document ? quiz.document.thumbnail : null;
            const action = quiz.score != null ? "Completed quiz for" : "Generated quiz for";
            activities.push({
                type: "quiz",
                text: `${action} "${docName}"`,
                date: quiz.createdAt,
                thumbnail,
            });
        });

        recentFlashcards.forEach(fc => {
            const docName = fc.document ? fc.document.filename : "a document";
            const thumbnail = fc.document ? fc.document.thumbnail : null;
            activities.push({
                type: "flashcard",
                text: `Generated flashcards from "${docName}"`,
                date: fc.createdAt,
                thumbnail,
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
