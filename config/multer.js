const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, path.join(__dirname, "..", "uploads"));
    },
    filename(req, file, cb) {
        cb(
            null,
            `${Date.now()}-${file.originalname.replace(/\s+/g, "")}`
        );
    },
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
        cb(null, true);
    } else {
        cb(new Error("Only PDF files allowed"));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = upload;
