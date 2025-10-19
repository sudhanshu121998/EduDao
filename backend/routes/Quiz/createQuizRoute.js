import express from "express";
import { verifyToken } from "../../middleware/verifytoken.js";
import {  createattempt, createquestion, createquiz,  createresponse,  deletequestion,  getAttemptRank,  getAttemptyId,  getQuizById,  getQuizes, updateattempt, updatequestion, updatequizname } from "../../Controller/teacher/createQuiz.controller.js";

// console,log(register);






const router=express.Router();

console.log("fasbfafnjabfaf");
router.post("/creatquiz",verifyToken, createquiz);
router.get("/getquiz",verifyToken, getQuizes);
router.get("/getquizbyid",verifyToken, getQuizById);
router.get("/getattemptbyid",verifyToken, getAttemptyId);
router.get("/getattemptbyrank",verifyToken, getAttemptRank);
router.post("/createquestion",verifyToken, createquestion);
router.post("/createattempt",verifyToken, createattempt);
router.post("/createresponse",verifyToken, createresponse);
router.put("/updatequestion",verifyToken, updatequestion);
router.put("/updatequizname",verifyToken, updatequizname);
router.put("/updateattempt",verifyToken, updateattempt);
router.delete("/deletequestion",verifyToken, deletequestion);




export default router;