import prisma from "../../lib/prisma.js";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
export const register = async (req, res) => {
  try {
    const { name, email, password,institute } = req.body;
    const hashpassword = await bcrypt.hash(password, 10);

    const existingUserEmail = await prisma.student.findFirst({
      where: {
        email,
      },
    });

    if (existingUserEmail) {
      return res.status(400).send("Email is already registered");
    }

    const newStudent = await prisma.student.create({
      data: {
        name,
        email,
        institute,
        
        password: hashpassword,
      },
    });

    res.status(200).send("student registered successfully");
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

  const student = await prisma.student.findUnique({
    where: { email },
  });

  

  if (!student) {
    return res.status(401).json({ message: "Invalid Credentials" });
  }

  // Compare the stored hashed password with the plaintext password
  const isPasswordValid = await bcrypt.compare(password, student.password);

  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid Credentials" });
  }

  const {password:studentPassword,...studentInfo}=student
  const age=1000*60*60*24*7;
  const token =jwt.sign({
      id:student.id,
  },process.env.JWT_SECRETE_KEY,
  {expiresIn:age}
)

console.log(process.env.PINATA_JWT);

res.cookie("token",token,{
  httpOnly:true,
  maxAge:age
}).status(200).json(studentInfo)
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


export const getStudentById=async(req,res)=>{
  try {
    const { studentId } = req.query;

    // ✅ Validate input
    if (!studentId) {
        return res.status(400).json({ error: "student ID is required" });
    }

    // ✅ Fetch quiz by ID
    const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { attempts: true }, // Optional: Fetch related questions
    });

    // ✅ Handle case where quiz is not found
    if (!student) {
        return res.status(404).json({ error: "student not found" });
    }

    res.status(200).json(student);
} catch (e) {
    console.error("Error fetching student:", e);
    res.status(500).json({ error: "Failed to fetch student" });
}
}