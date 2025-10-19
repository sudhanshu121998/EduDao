import forge from 'node-forge';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 🧭 Get absolute path to project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const keysDir = path.resolve(__dirname, '../../aesKeys'); // Adjust as per your structure

function loadKeyAndIV() {
  const keyPem = fs.readFileSync(path.join(keysDir, 'aes_key.pem'), 'utf8');
  const ivPem = fs.readFileSync(path.join(keysDir, 'aes_iv.pem'), 'utf8');

  const keyBase64 = keyPem
    .replace('-----BEGIN AES KEY-----', '')
    .replace('-----END AES KEY-----', '')
    .trim();

  const ivBase64 = ivPem
    .replace('-----BEGIN AES IV-----', '')
    .replace('-----END AES IV-----', '')
    .trim();

  const key = forge.util.decode64(keyBase64);
  const iv = forge.util.decode64(ivBase64);

  return { key, iv };
}

export function encryptJson(jsonData) {
  const { key, iv } = loadKeyAndIV();

  const cipher = forge.cipher.createCipher('AES-CBC', key);
  const jsonString = JSON.stringify(jsonData);
  cipher.start({ iv });
  cipher.update(forge.util.createBuffer(jsonString, 'utf8'));
  cipher.finish();

  const encrypted = cipher.output.getBytes();
  const encryptedBase64 = forge.util.encode64(encrypted);

  return encryptedBase64;
}

export function decryptJson(encryptedBase64) {
  const { key, iv } = loadKeyAndIV();

  const encryptedBytes = forge.util.decode64(encryptedBase64);

  const decipher = forge.cipher.createDecipher('AES-CBC', key);
  decipher.start({ iv });
  decipher.update(forge.util.createBuffer(encryptedBytes));
  const success = decipher.finish();

  if (!success) throw new Error('Decryption failed');

  const decryptedText = decipher.output.toString('utf8');
  return JSON.parse(decryptedText);
}