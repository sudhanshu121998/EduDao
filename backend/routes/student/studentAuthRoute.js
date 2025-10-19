import express from "express";
import { getStudentById, login, logout, register } from "../../Controller/student/studentAuthController.js";
import { verifyToken } from "../../middleware/verifytoken.js";
// console,log(register);






const router=express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout );
router.get("/getstudentbyid", verifyToken,getStudentById  );


export default router;