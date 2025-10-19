import { decryptJson, encryptJson } from "./aesAlogo.js";


const sampleData = [
  {
    question: "What is the capital of France?",
    options: ["Berlin", "Madrid", "Paris", "Rome"],
    answer: "Paris"
  }
];

// Encrypt
const encrypted = encryptJson(sampleData);
console.log("🔒 Encrypted Base64:\n", encrypted);

// Decrypt
const decrypted = decryptJson(encrypted);
console.log("🔓 Decrypted JSON:\n", decrypted);