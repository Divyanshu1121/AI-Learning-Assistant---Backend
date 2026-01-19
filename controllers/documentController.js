const Document = require("../models/Document");
const fs = require("fs")
const path = require("path");

exports.uploadDocument = async (req, res, next) => {
    try {
        if (!req.file) {
            res.status(400);
            throw new Error("No File Uploaded");
        }

        const doc = await Document.create({
            user: req.user._id.toString(),
            title: req.body.title || req.file.originalname,
            filename: req.file.filename,
            filepath: `uploads/${req.file.filename}`,
            filesize: req.file.size,
        });

        res.status(201).json(doc);
    } catch (error) {
        next(error);
    }
};

exports.getDocuments = async (req, res, next) => {
    try {
        const docs = await Document.find({ user: req.user._id }).sort({
            createdAt: -1,
        });
        res.json(docs);
    } catch (error) {
        next(error);
    }
};

exports.getDocumentsById = async (req, res, next) => {
    try {
        const doc = await Document.findOne({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!doc) {
            res.status(404);
            throw new Error("Document not found");
        }

        res.json(doc);
    } catch (error) {
        next(error);
    }
};

exports.deleteDocument = async (req, res, next) => {
    try {
        const doc = await Document.findOne({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!doc) {
            res.status(404);
            throw new Error("Document not found");
        }

        const absoluteFilePath = path.join(
            __dirname,
            "..",
            doc.filepath
        );

        console.log("Deleting file:", absoluteFilePath);

        if (fs.existsSync(absoluteFilePath)) {
            fs.unlinkSync(absoluteFilePath);
        } else {
            console.warn("File not found on disk:", absoluteFilePath);
        }

        await doc.deleteOne();

        res.json({ message: "Document deleted successfully" });
    } catch (error) {
        next(error);
    }
};