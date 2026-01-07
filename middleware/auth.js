const jwt = require("jsonwebtoken");
const user = require("../models/User");
const User = require("../models/User");

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization && req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            token = req.headers.authorization.split("")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select("-password");
            next();
        } catch (error) {
            res.status(401);
            next(new Error("Not Authorized"));
        }
    }

    if (!token) {
        res.status(401);
        next(new Error("No Token Provided"));
    }
};

module.exports = protect;