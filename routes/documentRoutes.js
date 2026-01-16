const express = require("express");
const upload = require("../config/multer");
const protect = require("../middleware/auth");
const {
    uploadDocument, getDocuments, getDocumentsById, deleteDocument
} = require("../controllers/documentController");

const router = express.Router();

router.post("/", protect, upload.single("file"), uploadDocument);
router.get("/", protect, getDocuments);
router.get("/:id", protect, getDocumentsById);
router.delete("/:id", protect, deleteDocument);

module.exports = router;

