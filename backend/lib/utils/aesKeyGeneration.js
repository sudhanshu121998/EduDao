import forge from 'node-forge';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📁 Go up to the backend root from current file (e.g., utils folder)
const backendRoot = path.resolve(__dirname, '../..'); // adjust if needed

// ✅ Target path: backend/aesKeys
const folderPath = path.join(backendRoot, 'aesKeys');

// 🔐 Generate key and IV
const key = forge.random.getBytesSync(32); // 256-bit key
const iv = forge.random.getBytesSync(16);  // 128-bit IV

const keyBase64 = forge.util.encode64(key);
const ivBase64 = forge.util.encode64(iv);

const keyPem = `-----BEGIN AES KEY-----\n${keyBase64}\n-----END AES KEY-----`;
const ivPem = `-----BEGIN AES IV-----\n${ivBase64}\n-----END AES IV-----`;

// 📁 Create aesKeys folder if not exists
if (!fs.existsSync(folderPath)) {
  fs.mkdirSync(folderPath, { recursive: true });
}

// 📝 Save to files
fs.writeFileSync(path.join(folderPath, 'aes_key.pem'), keyPem);
fs.writeFileSync(path.join(folderPath, 'aes_iv.pem'), ivPem);

console.log('✅ AES Key and IV saved to backend/aesKeys/');