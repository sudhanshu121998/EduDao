import prisma from "../../lib/prisma.js";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
export const register = async (req, res) => {
  try {
    const { name, email, institute, password } = req.body;
    const hashpassword = await bcrypt.hash(password, 10);

    const existingUserEmail = await prisma.teacher.findFirst({
      where: {
        email,
      },
    });

    if (existingUserEmail) {
      return res.status(400).send("Email is already registered");
    }

    const newTeacher = await prisma.teacher.create({
      data: {
        name,
        email,
        institute,
        password: hashpassword,
      },
    });

    res.status(200).send("User registered successfully");
  } catch (e) {
    if (e.code === 'P2002') {
      res.status(400).send(`Unique constraint failed on the ${e.meta.target} field`);
    } else {
      console.error(e);
      res.status(500).send("An error occurred while registering the user");
    }
  }
};

export const login = async (req, res) => {

  try{
  const { email, password } = req.body;

  const teacher = await prisma.teacher.findUnique({
    where: { email },
  });

  

  if (!teacher) {
    return res.status(401).json({ message: "Invalid Credentials" });
  }

  // Compare the stored hashed password with the plaintext password
  const isPasswordValid = await bcrypt.compare(password, teacher.password);

  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid Credentials" });
  }

  const {password:teacherPassword,...teacherInfo}=teacher
  const age=1000*60*60*24*7;
  const token =jwt.sign({
      id:teacher.id,
  },process.env.JWT_SECRETE_KEY,
  {expiresIn:age}
)

// console.log("adadadadad",process.env.PINATA_JWT)

res.cookie("token",token,{
  httpOnly:true,
  secure: true,  // Required for HTTPS
  sameSite: "None",  // Required for cross-site cookies
  // domain: ".onrender.com",
  maxAge:age
}).status(200).json(teacherInfo)
}
catch(e) {

  // Log and send generic error
  console.error(e);
  res.status(500).send("Invalid Credentials");

}

 
};
export const logout =(req,res)=>{
res.clearCookie("token").status(200).json({message:"logout successful"})
}

export const getTeacherById=async(req,res)=>{
  try {
    const { teacherId } = req.query;

    // ✅ Validate input
    if (!teacherId) {
        return res.status(400).json({ error: "teacher ID is required" });
    }

    // ✅ Fetch quiz by ID
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
          quizzes: {
              include: {
                  attempts: true, // Fetch all attempts for each quiz
              },
          },
      },
  });

    // ✅ Handle case where quiz is not found
    if (!teacher) {
        return res.status(404).json({ error: "teacher not found" });
    }

    res.status(200).json(teacher);
} catch (e) {
    console.error("Error fetching teacher:", e);
    res.status(500).json({ error: "Failed to fetch teacher" });
}
}