const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        const fs = require('fs');
        fs.writeFileSync('db_error.txt', `DB Connection Error: ${error.message}\n${error.stack}`);
        process.exit(1);
    }
};

module.exports = connectDB;
