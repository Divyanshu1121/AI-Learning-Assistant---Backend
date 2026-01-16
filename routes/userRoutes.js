const express = require("express");
const protect = require("../middleware/auth");
const { updateName, changePassword, } = require("../controllers/userController");
const router = express.Router();

router.put("/update-name", protect, updateName);
router.put("/change-password", protect, changePassword);

module.exports = router;