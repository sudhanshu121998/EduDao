import { encryptJsonArray } from "../../lib/utils/encryptDecrypt.js";
import jwt from 'jsonwebtoken';
import {  getDataFromCID, upload } from "../../PINATA/pinata.js";
import { decryptJson, encryptJson } from "../../lib/utils/aesAlogo.js";
import { displayStudentScore, getCIDFromChain, getQuizScore, getStudentResponse, storeEncryptedCIDOnChain, storeQuizScore, storeStudentResponse, studentScore, } from "../../lib/smartContractFunctions/smartContractFunctions.js";




export const encryptPaper = async (req, res) => {
  try {
    const { questions, quizId, startTime, date } = req.body;

    // Combine date and time into ISO string
    const combinedStartTime = new Date(`${date}T${startTime}:00Z`).toISOString();
    
    console.log(combinedStartTime);
    const encryptedHash = encryptJson(questions);
    const ipfs = await upload(encryptedHash);

    await storeEncryptedCIDOnChain(quizId, ipfs.cid, combinedStartTime);

    return res.status(200).json({ ipfs,combinedStartTime });
  } catch (error) {
    console.error('Encryption error:', error);
    return res.status(500).json({ error: 'Failed to encrypt questions' });
  }
}; 
export const decryptPaper = async (req, res) => {
  try {
    console.log("hiiiii")
    const { quizId} = req.body;
   const cid= await getCIDFromChain(quizId);

   const encryptedHash=await getDataFromCID(cid)
console.log(encryptedHash.data.encryptedData)
   const questionPaper=decryptJson(encryptedHash.data.encryptedData);
   return res.status(200).json(questionPaper);

  } catch (error) {
    console.error('Decryption error:', error);
    return res.status(500).json({ error: 'Failed to decrypt questions' });
  }
}; 

export const studentResponse = async (req, res) => {
  try {
    const {  quizId, studentId, response } = req.body;

    // Combine date and time into ISO string
  
    
    
    const encryptedHash = encryptJson(response);
    const ipfs = await upload(encryptedHash);

    await storeStudentResponse (quizId, ipfs.cid, studentId);

    return res.status(200).json({ message: "suuccess" });
  } catch (error) {
    console.error('Encryption error:', error);
    return res.status(500).json({ error: 'Failed to encrypt questions' });
  }
};

export const studentResult = async (req, res) => {
  try {
    const {  quizId, studentId } = req.body;

    // Combine date and time into ISO string
  
    
    

    // const ipfs = await upload(response);

  const ipfs=  await getStudentResponse (quizId, studentId);
  const hash=await getDataFromCID(ipfs);
  console.log(hash);
  const questionPaper=decryptJson(hash.data.encryptedData);
  // console.log(questionPaper);
    return res.status(200).json(questionPaper);
  } catch (error) {
    console.error('Encryption error:', error);
    return res.status(500).json({ error: 'Failed to encrypt questions' });
  }
};
export const addStudentResult = async (req, res) => {
  try {
    const {  quizId, studentId,score } = req.body;



await  studentScore(quizId,studentId,score);
  // console.log(questionPaper);
    return res.status(200).json({"message": "done"});
  } catch (error) {
    console.error(' error:', error);
    return res.status(500).json({ error: 'Failed to add score' });
  }
};
export const showStudentScore = async (req, res) => {
  try {
    const {  quizId } = req.body;

   

const result =await  displayStudentScore(quizId);
  // console.log(questionPaper);
    return res.status(200).json(result);
  } catch (error) {
    console.error(' error:', error);
    return res.status(500).json({ error: 'Failed to show scores' });
  }
};

export const storeScoreForStudent = async (req, res) => {
  try {
    const {  quizId, quizName, studentId,score } = req.body;

    console.log("hhhhhhh");

await  storeQuizScore(quizId,quizName,studentId,score);
  
    return res.status(200).json({"message": "done"});
  } catch (error) {
    console.error(' error:', error);
    return res.status(500).json({ error: 'Failed to add score' });
  }
};

export const showScore = async (req, res) => {
  try {
    const {  studentId } = req.body;

   

const result =await  getQuizScore(studentId);
  // console.log(questionPaper);
    return res.status(200).json(result);
  } catch (error) {
    console.error(' error:', error);
    return res.status(500).json({ error: 'Failed to show scores' });
  }
};


  