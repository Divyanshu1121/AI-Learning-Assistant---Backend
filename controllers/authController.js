const User = require("../models/User");
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

exports.register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            res.status(400);
            throw new Error("All Fields Required");
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400);
            throw new Error("User Already Exists");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name, email, password: hashedPassword,
        });

        res.status(201).json({
            success: true,
            token: generateToken(user._id),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                plan: user.plan,
                usage: user.usage,
            },
        });
    }
    catch (error) {
        next(error);
    }
};

// Helper to update streak
const updateStreak = async (user) => {
    const today = new Date();
    const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate) : null;

    if (lastLogin) {
        // Create dates without time for accurate day comparison
        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const lastLoginDate = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate());

        const diffTime = Math.abs(todayDate - lastLoginDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            // Same day, do nothing
        } else if (diffDays === 1) {
            // Consecutive day
            user.streak = (user.streak || 0) + 1;
        } else {
            // Missed a day
            user.streak = 1;
        }
    } else {
        user.streak = 1;
    }

    user.lastLoginDate = today;
    await user.save();
    return user;
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400);
            throw new Error("Email and Password Required");
        }

        let user = await User.findOne({ email });
        if (!user) {
            res.status(401);
            throw new Error("Invalid Credentials");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(401);
            throw new Error("Invalid Credentials");
        }

        // Update streak
        user = await updateStreak(user);

        res.status(200).json({
            success: true,
            token: generateToken(user._id),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                streak: user.streak,
                plan: user.plan,
                usage: user.usage,
            },
        });
    } catch (error) {
        next(error);
    }
};

exports.getMe = async (req, res, next) => {
    try {
        let user = await User.findById(req.user.id);
        if (!user) {
            res.status(404);
            throw new Error("User not found");
        }

        // Update streak on page load too!
        user = await updateStreak(user);

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                streak: user.streak,
                plan: user.plan,
                usage: user.usage,
            },
        });
    } catch (error) {
        next(error);
    }
};

exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400);
            throw new Error("Email is required");
        }
        const user = await User.findOne({ email });

        if (!user) {
            res.status(400);
            throw new Error("User not found");
        }

        const resetToken = user.getResetPasswordToken();
        await user.save({ validateBeforeSave: false });

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        res.status(200).json({
            success: true,
            message: "Password Reset Token Generated",
            resetUrl,
        });
    } catch (error) {
        next(error);
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const resetToken = req.params.token;
        const { password } = req.body;

        if (!password) {
            res.status(400);
            throw new Error("New password is required");
        }

        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            res.status(400);
            throw new Error("Invalid or expired token");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password reset successful",
        });
    } catch (error) {
        next(error);
    }
};
