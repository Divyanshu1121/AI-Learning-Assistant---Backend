const User = require("../models/User");
const bcrypt = require("bcryptjs");

exports.updateName = async (req, res, next) => {
    try {
        const { name } = req.body;

        if (!name) {
            res.status(400);
            throw new Error("Name is Required");
        }

        const user = await User.findById(req.user._id).select("+password");
        if (!user) {
            res.status(400);
            throw new Error("User Not Found");
        }
        user.name = name;
        await user.save();

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        next(error);
    }
};

exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            res.status(400);
            throw new Error("All fields are required");
        }
        const user = await User.findById(req.user._id).select("+password");

        const isMatch = await bcrypt.compare(
            currentPassword, user.password
        );

        if (!isMatch) {
            res.status(401);
            throw new Error("Current Password is Incorrect");
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({
            success: true,
            message: "Password Changed Successfully",
        });
    } catch (error) {
        next(error);
    }
};
