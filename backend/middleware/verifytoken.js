import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  console.log("middleware1111")
  const token = req.cookies.token;

  console.log(token);

  

  if (!token) {
    return res.status(401).json({ message: "Not Authenticated!" });
  }

  jwt.verify(token, process.env.JWT_SECRETE_KEY, (err, payload) => {
    if (err) {
      
      return res.status(403).json({ message: "Token is not Valid!" });
    }

    req.userId = payload.id; // Attach userId to the request object
    

    next();
  });
};