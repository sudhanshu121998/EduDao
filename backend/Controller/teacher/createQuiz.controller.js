import prisma from "../../lib/prisma.js";

export const createquiz =async(req,res)=>{
  
    console.log("hoiii")

    try{
        const userId=req.userId;

    const {quizName, date,startTime,endTime}=req.body;

    

    const newQuiz=await prisma.quiz.create({
        data:{
            quizName,
            date:date,
            startTime,
            endTime,
            teacherId:userId
        }
    })
    console.log("success!!")
    res.status(200).send(newQuiz);
          


    }
    catch(err){

        console.log(err)
        res.status(400).send("failed")

    }

    


}

export const getQuizes = async (req, res) => {
    const { teacherId } = req.query;

    // ✅ Validate teacherId
    if (!teacherId) {
        return res.status(400).json({ error: "Teacher ID is required" });
    }

    try {
        const quizzes = await prisma.quiz.findMany({
            where: {
                teacherId: teacherId.toString(), // ✅ Ensure teacherId is a string
            },
            orderBy: {
                date: "desc", // ✅ Sort quizzes by date (latest first)
            },
        });

        res.status(200).json(quizzes);
    } catch (error) {
        console.error("Error fetching quizzes:", error);
        res.status(500).json({ error: "Failed to fetch quizzes" });
    }
};
export const getQuestions = async (req, res) => {
    try {
        const { quizId } = req.query; // Extract quizId from query params

        if (!quizId) {
            return res.status(400).json({ message: "Quiz ID is required" });
        }

        // Fetch questions related to a specific quiz
        const questions = await prisma.questions.findMany({
            where: { quizId },
        });

        return res.status(200).json(questions);
    } catch (error) {
        console.error("Error fetching questions:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
export const getQuizById = async (req, res) => {
    try {
        const { quizId } = req.query;

        // ✅ Validate input
        if (!quizId) {
            return res.status(400).json({ error: "Quiz ID is required" });
        }

        // ✅ Fetch quiz by ID
        const quiz = await prisma.quiz.findUnique({
            where: { id: quizId },
            include: { 
                attempts:true
             }, // Optional: Fetch related questions
        });

        // ✅ Handle case where quiz is not found
        if (!quiz) {
            return res.status(404).json({ error: "Quiz not found" });
        }

        res.status(200).json(quiz);
    } catch (e) {
        console.error("Error fetching quiz:", e);
        res.status(500).json({ error: "Failed to fetch quiz" });
    }
};
export const getAttemptyId = async (req, res) => {
    try {
        const { attemptId } = req.query;

        // ✅ Validate input
        if (!attemptId) {
            return res.status(400).json({ error: "attempt ID is required" });
        }

        // ✅ Fetch quiz by ID
        const attempt = await prisma.attempt.findUnique({
            where: { id: attemptId },
            include: { responses: true }, // Optional: Fetch related questions
        });

        // ✅ Handle case where quiz is not found
        if (!attempt) {
            return res.status(404).json({ error: "Attempt not found" });
        }

        res.status(200).json(attempt);
    } catch (e) {
        console.error("Error fetching attempt:", e);
        res.status(500).json({ error: "Failed to fetch attempt" });
    }
};
export const getAttemptRank = async (req, res) => {
    try {
        const { attemptId, quizId } = req.query;

        // ✅ Validate input
        if (!attemptId || !quizId) {
            return res.status(400).json({ error: "Attempt ID and Quiz ID are required" });
        }

        // ✅ Fetch all attempts for the quiz, sorted by score in descending order
        const attempts = await prisma.attempt.findMany({
            where: { quizId },
            orderBy: { score: "desc" }, // 🔥 Sorting high to low
            select: { id: true, score: true }, // Only fetching required fields
        });

        // ✅ Find the rank of the given attempt
        const rank = attempts.findIndex((attempt) => attempt.id === attemptId) + 1;

        // ✅ If attempt is not found in the quiz attempts
        if (rank === 0) {
            return res.status(404).json({ error: "Attempt not found in this quiz" });
        }

        res.status(200).json({ rank });
    } catch (error) {
        console.error("Error fetching attempt rank:", error);
        res.status(500).json({ error: "Failed to fetch attempt rank" });
    }
};

export const createquestion=async(req,res)=>{
    const { quizId } = req.query;
    try{
        const {question, optionA,optionB,optionC,optionD,correctAnswer,difficulty,images}=req.body;

        const newQuestion=await prisma.questions.create({
            data:{
                question,
                optionA,
                optionB,
                optionC,
                optionD,
                images,
                correctAnswer,
                difficulty,
                quizId
            }
        })
        res.status(200).send(newQuestion)
    }
    catch(e){
        console.log(e)
        res.status(400).send("failed to create Question")
    } 
    
}
export const createattempt=async(req,res)=>{
    const { quizId,studentId } = req.query;
    try{
        const {score}=req.body;

        const newAttempt=await prisma.attempt.create({
            data:{
             studentId,
              quizId,
              score,
              submitted :true

            }
        })

       
        res.status(200).send(newAttempt)
    }
    catch(e){
        console.log(e)
        res.status(400).send("failed to create Attempt")
    }
    
   
    
}
export const updateattempt = async (req, res) => {
    try {
        const { score, attemptId } = req.body;

        if (!attemptId) {
            return res.status(400).json({ error: "Attempt ID is required" });
        }

        const updatedAttempt = await prisma.attempt.update({
            where: {
                id: attemptId, // ✅ Correct syntax
            },
            data: {
                score, // ✅ Updating the score
            },
        });

        res.status(200).json(updatedAttempt);
    } catch (e) {
        console.error("Error updating attempt:", e);
        res.status(500).json({ error: "Failed to update attempt" });
    }
};
export const createresponse=async(req,res)=>{
    // const { quizId } = req.query;
    try{
        const {attemptId,questionId,selectedAnswer,isCorrect}=req.body;

        const newResponse=await prisma.response.create({
            data:{
             attemptId,
             questionId,
             selectedAnswer,
             isCorrect


            }
        })

       
        res.status(200).send(newResponse)
    }
    catch(e){
        console.log(e)
        res.status(400).send("failed to create Response")
    }
    
   
    
}

export const updatequestion = async (req, res) => {
    try {
        const { questionId, question, optionA, optionB, optionC, optionD, correctAnswer, difficulty } = req.body;

        // Validate input
        if (!questionId) {
            return res.status(400).send("Question ID is required");
        }

        // Update the question in the database
        const updatedQuestion = await prisma.questions.update({
            where: { id: questionId },
            data: {
                question,
                optionA,
                optionB,
                optionC,
                optionD,
                correctAnswer,
                difficulty,
            },
        });

        res.status(200).json(updatedQuestion);
    } catch (error) {
        console.error("Error updating question:", error);
        res.status(500).send("Failed to update question");
    }
};

export const updatequizname = async (req, res) => {
    try {
        const { quizId } = req.query;
        const { quizName } = req.body;

        // ✅ Validate input
        if (!quizId) {
            return res.status(400).json({ error: "Quiz ID is required" });
        }
        if (!quizName) {
            return res.status(400).json({ error: "Quiz Name is required" });
        }

        // ✅ Update the quiz name
        const updatedQuiz = await prisma.quiz.update({
            where: { id: quizId },
            data: { quizName },
        });

        res.status(200).json(updatedQuiz);
    } catch (error) {
        console.error("Error updating quiz name:", error);
        res.status(500).json({ error: "Failed to update quiz name" });
    }
};

export const deletequestion = async (req, res) => {
    try {
        const { questionId } = req.query; // ✅ Extract questionId from request query

        // ✅ Validate input
        if (!questionId) {
            return res.status(400).json({ error: "Question ID is required" });
        }

        // ✅ Delete the question from the database
        await prisma.questions.delete({
            where: { id: questionId },
        });

        res.status(200).json({ message: "Question deleted successfully" });
    } catch (error) {
        console.error("Error deleting question:", error);
        res.status(500).json({ error: "Failed to delete question" });
    }
};