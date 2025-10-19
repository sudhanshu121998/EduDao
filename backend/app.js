import dotenv from 'dotenv';
dotenv.config();


import express from "express";

import cookieParser from "cookie-parser";
import teacherAuthRouter from "./routes/teacher/teacherAuthRoute.js"
import studentAuthRouter from "./routes/student/studentAuthRoute.js"
import QuizRouter from "./routes/Quiz/createQuizRoute.js"
import rsaRouter from "./routes/RSA/rsa.js"
import cors from "cors";
import updateQuizStatus from "./Controller/teacher/quizScheduller/quizScheduler.js";
const app = express();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cookieParser())
app.use(cors({
    origin: ["http://localhost:5173", "https://quiz-2-k76f.onrender.com"], 
    credentials: true,
}));
app.use("/api/auth/teacher/homepage",QuizRouter)
app.use("/api/auth/teacher",teacherAuthRouter)
app.use("/api/auth/student",studentAuthRouter)
app.use("/api/auth/rsa",rsaRouter)

updateQuizStatus();
// Routes
app.get("/", (req, res) => {
    res.send("Backend Server is Running!");
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});