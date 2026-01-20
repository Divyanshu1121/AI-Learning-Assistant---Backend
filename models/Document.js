const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        filename: {
            type: String,
            required: true,
        },
        filepath: {
            type: String,
            required: true,
        },
        filesize: {
            type: Number,
            required: true,
        },
        summary: {
            type: String,
            default: "",
        },
    },
    { timestamp: true }
);

module.exports = mongoose.model("Document", documentSchema);