import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "node-forge";

const { pki, util, md } = pkg;

// 📍 Resolve __dirname manually for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔑 Path to Keys directory
const keysDir = path.join(__dirname, "../keys");

// 🗝 Read PEM files
const privateKeyPem = readFileSync(path.join(keysDir, "private.key.pem"), "utf-8");
const publicKeyPem = readFileSync(path.join(keysDir, "public.key.pem"), "utf-8");

// 🔐 Convert PEM to key objects
const privateKey = pki.privateKeyFromPem(privateKeyPem);
const publicKey = pki.publicKeyFromPem(publicKeyPem);

// 🔄 Encryption Function
export const encryptJsonArray = (jsonArray) => {
  const jsonString = JSON.stringify(jsonArray);
  const encrypted = publicKey.encrypt(jsonString, "RSA-OAEP", {
    md: md.sha256.create()
  });
  return util.encode64(encrypted);
};

// 🔓 Decryption Function
export const decryptJsonArray = (encryptedBase64) => {
  const encryptedBytes = util.decode64(encryptedBase64);
  const decryptedString = privateKey.decrypt(encryptedBytes, "RSA-OAEP", {
    md: md.sha256.create()
  });
  return JSON.parse(decryptedString);
};

// ✅ Example usage (can be removed in production)


