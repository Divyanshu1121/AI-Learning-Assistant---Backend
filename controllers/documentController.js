const Document = require("../models/Document");
const fs = require("fs")
const path = require("path");

const getRandomGradient = () => {
    const gradients = [
        "bg-gradient-to-br from-indigo-500 to-purple-600",
        "bg-gradient-to-br from-blue-500 to-cyan-400",
        "bg-gradient-to-br from-emerald-400 to-cyan-500",
        "bg-gradient-to-br from-rose-500 to-pink-600",
        "bg-gradient-to-br from-amber-400 to-orange-500",
        "bg-gradient-to-br from-fuchsia-500 to-purple-600",
        "bg-gradient-to-br from-sky-400 to-blue-500",
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
};

exports.uploadDocument = async (req, res, next) => {
    try {

        const { checkLimit, incrementUsage } = require("../services/subscriptionService");

        if (!req.file) {
            res.status(400);
            throw new Error("No File Uploaded");
        }

        // Check if user has reached document limit
        try {
            checkLimit(req.user, 'documents');
        } catch (e) {
            res.status(403);
            throw e;
        }


        const doc = await Document.create({
            user: req.user._id.toString(),
            title: req.body.title || req.file.originalname,
            filename: req.file.filename,
            filepath: `uploads/${req.file.filename}`,
            filesize: req.file.size,
            thumbnail: getRandomGradient(),
        });

        await incrementUsage(req.user, 'documents');

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