const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const errorHandle = require("./middleware/errorHandle");
const authRoutes = require("./routes/authRoutes");
const documentRoutes = require("./routes/documentRoutes");
const path = require("path");
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
    res.send("AI Learning Assistant API running...");
});


app.use(errorHandle);

const PORT = process.env.PORT;

connectDB();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
