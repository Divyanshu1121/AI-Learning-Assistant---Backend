const mongoose = require("mongoose");

const summarySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    document: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "document",
        required: true,
        unique: true,
    },
    content: {
        type: String,
        required: true,
    },
},
    { timestamps: true }
);

module.exports = mongoose.model("Summary", summarySchema);