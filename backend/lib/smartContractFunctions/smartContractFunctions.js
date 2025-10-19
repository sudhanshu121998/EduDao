import { JsonRpcProvider, Wallet, Contract } from "ethers";
import { abi } from "../../abi/abi.js";

// Config
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY
const PROVIDER_URL = process.env.PROVIDER_URL;

const provider = new JsonRpcProvider(PROVIDER_URL);
const wallet = new Wallet(PRIVATE_KEY, provider);
const contract = new Contract(CONTRACT_ADDRESS, abi, wallet);
let drift;

// 📥 Store CID


// ⏳ Sync Chain Time with Real Time
async function syncChainTimeWithRealTime() {
  const now = Math.floor(Date.now() / 1000);
  const chainTime = (await provider.getBlock("latest")).timestamp;
  const diff = now - chainTime;

  if (diff > 0) {
    await provider.send("evm_increaseTime", [diff + 1]);
    await provider.send("evm_mine");
    console.log(`⏩ Chain time fast-forwarded by ${diff + 1} seconds`);
  } else {
    console.log("✅ Chain time is already synced or ahead");
  }
}

export async function storeEncryptedCIDOnChain(paperId, cid, unlockDateTime) {
  try {
   console.log(unlockDateTime);
    const unlockTime = Math.floor(new Date(unlockDateTime).getTime() / 1000);
    const now = Math.floor(Date.now() / 1000);

   

    

  console.log("nowww",now)
 
  
    console.log("unlockTime",unlockTime);
  
    const tx = await contract.storePaper(paperId, cid, unlockTime);
    await tx.wait();

    console.log(`✅ CID "${cid}" stored for paperId "${paperId}" with unlock time ${unlockTime}`);
    return tx.hash;
  } catch (err) {
    console.error(`❌ Paper "${paperId}" could not be uploaded. Error:`, err.reason || err.message || err);
    return null;
  }
}

// 📤 Get CID with internal time sync
export async function getCIDFromChain(paperId) {
  try {
  
    console.log("paperId",paperId)
    const now = Math.floor((Date.now() + (5.5 * 60 * 60 * 1000))/1000);

  
   
    console.log("now",now)
 
  

    console.log("now:", now);

   console.log("asdasddfaffa")

   
    
   console.log("📍 Checking if paper exists on-chain...");
   const exists = await contract.paperExists(paperId);
   console.log("🔎 Exists:", exists);
    const cid = await contract.getPaperCID(paperId,now);
    
    console.log(`📄 CID for "${paperId}": ${cid}`);
   return cid;
  } catch (err) {
    console.error("❌ Error retrieving CID:", err.reason || err);

    
    throw err;
  }
}
export async function storeStudentResponse(paperId, cid, studentId) {
  try {
  
    const tx = await contract.storeStudentResponse(paperId, cid, studentId);
    await tx.wait();
  
  } catch (err) {
    console.error("❌ storing response:", err.reason || err);

    
    throw err;
  }
}
export async function studentScore(paperId,studentId,score) {
  try {
  
    const tx = await contract.addStudentScore(paperId,studentId,score);
    await tx.wait();
  
  } catch (err) {
    console.error("❌ Error in adding score :", err.reason || err);

    
    throw err;
  }
}
export async function getStudentResponse(paperId, studentId) {
  try {
  
    const cid = await contract.getStudentResponseCID(paperId,studentId);
    return cid
  
  } catch (err) {
    console.error("❌ Error retrieving CID:", err.reason || err);

    
    throw err;
  }
}
export async function displayStudentScore(paperId, studentId) {
  try {
    const studentScores = await contract.getStudentScores(paperId);
    
    // Convert BigInt to regular number or string
    const formattedScores = studentScores.map((student) => ({
      studentId: student[0],
      
      score: Number(student[1]) // or use `score: student[1].toString()` if you want to keep it as string
    }));

    console.log("studentScore", formattedScores);
    return formattedScores;

  } catch (err) {
    console.error("❌ Error retrieving student scores:", err.reason || err);
    throw err;
  }
}

export async function storeQuizScore(paperId,quizName,studentId,score) {
  try {
   console.log("adadadasdasd")
   const tx= await contract.storeQuizScore(paperId,quizName,studentId,score);
   await tx.wait();
    // return cid
  
  } catch (err) {
    console.error("❌ Error storing quiz score:", err.message || err);

    
    throw err;
  }
}

export async function getQuizScore(studentId) {
  try {
    const quizScores = await contract.getQuizScores(studentId);
    
    const formattedScores = quizScores.map((quiz) => ({
      quizId: quiz[0], 
      quizName: quiz[1],           // ✅ corrected typo
      score: Number(quiz[2])      // if you're sure it's always a number
    }));

    console.log("quizScore", formattedScores);
    return formattedScores;

  } catch (err) {
    console.error("❌ Error retrieving quiz scores:", err.reason || err);
    throw err;
  }
}
// Export contract & provider in case needed externally
export { contract, provider };