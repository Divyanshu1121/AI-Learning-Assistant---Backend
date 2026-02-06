require("dotenv").config({ path: __dirname + "/.env" });
console.log("GROQ KEY EXISTS:", !!process.env.GROQ_API_KEY);

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const errorHandle = require("./middleware/errorHandle");
const authRoutes = require("./routes/authRoutes");
const documentRoutes = require("./routes/documentRoutes");
const aiRoutes = require("./routes/aiRoutes");
const userRoutes = require("./routes/userRoutes");
const flashcardRoutes = require("./routes/flashcardRoutes");
const summaryRoutes = require("./routes/summaryRoutes");
const quizRoutes = require("./routes/quizRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const path = require("path");
dotenv.config();

const app = express();
app.use(cors({
    origin: [
        "http://localhost:3000",
        "https://ai-learning-assistant-frontend-two.vercel.app"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/user", userRoutes);
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/summary", summaryRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/search", require("./routes/searchRoutes"));
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
