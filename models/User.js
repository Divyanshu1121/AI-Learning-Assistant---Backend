const mongoose = require('mongoose')
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        resetPasswordToken: String,
        resetPasswordExpire: Date,
        streak: {
            type: Number,
            default: 0
        },
        lastLoginDate: {
            type: Date,
            default: null
        },
        plan: {
            type: String,
            enum: ['free', 'pro'],
            default: 'free'
        },
        subscriptionDate: {
            type: Date,
            default: Date.now
        },
        usage: {
            documentsUploaded: { type: Number, default: 0 },
            summariesGenerated: { type: Number, default: 0 },
            flashcardsGenerated: { type: Number, default: 0 },
            quizzesGenerated: { type: Number, default: 0 }
        }
    },
    { timestamps: true }
);

userSchema.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString("hex");

    this.resetPasswordToken = crypto
        .createHash("sha-256")
        .update(resetToken)
        .digest("hex")

    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

module.exports = mongoose.model("User", userSchema);