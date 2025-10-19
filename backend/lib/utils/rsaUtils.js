import { fileURLToPath } from "url";
import path from "path";
import pkg from "node-forge";
import { mkdirSync, writeFileSync, existsSync } from "fs";

const { pki } = pkg;

// 🔁 ES Module-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Step 1: Generate RSA Key Pair
const { privateKey, publicKey } = pki.rsa.generateKeyPair(2048);

// Step 2: Convert to PEM format
const privateKeyPem = pki.privateKeyToPem(privateKey);
const publicKeyPem = pki.publicKeyToPem(publicKey);

// Step 3: Define output paths
const keysDir = path.join(__dirname, "../Keys"); // adjust path if needed
const privateKeyPath = path.join(keysDir, "private.key.pem");
const publicKeyPath = path.join(keysDir, "public.key.pem");

// Step 4: Create keys directory if not exists
if (!existsSync(keysDir)) {
  mkdirSync(keysDir, { recursive: true });
}

// Step 5: Write PEM files
writeFileSync(privateKeyPath, privateKeyPem, { encoding: "utf-8" });
writeFileSync(publicKeyPath, publicKeyPem, { encoding: "utf-8" });

console.log("✅ PRIVATE KEY written to", privateKeyPath);
console.log("✅ PUBLIC KEY written to", publicKeyPath);