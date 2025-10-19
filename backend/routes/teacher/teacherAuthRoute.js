import express from "express";
import { getTeacherById, login, logout, register } from "../../Controller/teacher/auth.controller.js";
import { verifyToken } from "../../middleware/verifytoken.js";
// console,log(register);






const router=express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout );
router.get("/getteacherbyid", verifyToken,getTeacherById  );

export default router;