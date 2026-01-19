// const jwt = require("jsonwebtoken");
// const User = require("../models/User");

// const protect = async (req, res, next) => {
//     let token;

//     if (
//         req.headers.authorization &&
//         req.headers.authorization.startsWith("Bearer")
//     ) {
//         token = req.headers.authorization.split(" ")[1];
//     }

//     if (!token) {
//         res.status(401);
//         throw new Error("No token");
//     }

//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         req.user = await User.findById(decoded.id).select("-password");
//         next();
//     } catch (error) {
//         res.status(401);
//         throw new Error("Not authorized");
//     }
// };

// module.exports = protect;

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    let token;

    // 1. Check if the Authorization header exists and starts with 'Bearer'
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            // 2. Extract the token from the "Bearer <token>" string
            token = req.headers.authorization.split(" ")[1];

            // 3. Verify the token using your Secret Key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 4. Find the user in the DB and attach to the request object (req.user)
            // We exclude the password for security
            req.user = await User.findById(decoded.id).select("-password");

            if (!req.user) {
                res.status(401);
                return next(new Error("User associated with this token no longer exists"));
            }

            // 5. Move to the next middleware or controller
            next();
        } catch (error) {
            console.error("JWT Verification Error:", error.message);
            res.status(401);
            // Pass the specific error (Expired or Invalid) to the error handler
            return next(new Error("Not authorized, token failed"));
        }
    }

    // 6. If no token was found at all
    if (!token) {
        res.status(401);
        return next(new Error("Not authorized, no token provided"));
    }
};

module.exports = protect;
