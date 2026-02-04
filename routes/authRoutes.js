const express = require("express");
const { register, login, googleLogin, getMe, forgotPassword, resetPassword } = require("../controllers/authController");

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
const protect = require("../middleware/auth");
router.get('/me', protect, getMe);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

module.exports = router;