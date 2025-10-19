import express from "express";
import { verifyToken } from "../../middleware/verifytoken.js";
import { addStudentResult, decryptPaper, encryptPaper, showScore, showStudentScore, storeScoreForStudent, studentResponse, studentResult } from "../../Controller/RSA/rsa.js";





// console,log(register);






const router=express.Router();


router.post("/encryptpaper",verifyToken, encryptPaper);
router.post("/decryptpaper",verifyToken, decryptPaper);
router.post("/uploadresponse",verifyToken, studentResponse);
router.post("/studentresult",verifyToken, studentResult);
router.post("/addstudentscore",verifyToken,addStudentResult);
router.post("/showstudentscore",verifyToken,showStudentScore);
router.post("/storequizscore",verifyToken,storeScoreForStudent);
router.post("/showscore",verifyToken,showScore);





export default router;