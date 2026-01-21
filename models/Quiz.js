const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
    question: String,
    options: [String],
    correctAnswer: String,
});

const quizSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    document: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
        required: true,
    },
    score: {
        type: Number,
        default: null,
    },
    accuracy: {
        type: Number,
        default: null,
    },
    questions: [questionSchema],
},
    { timestamps: true }
);

module.exports = mongoose.model("Quiz", quizSchema);