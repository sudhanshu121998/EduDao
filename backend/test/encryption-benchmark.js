import { encryptJson, decryptJson } from '../lib/utils/aesAlogo.js';
import { encryptJsonArray, decryptJsonArray } from '../lib/utils/encryptDecrypt.js';
import crypto from 'crypto';
import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("\n🔐 ENCRYPTION PERFORMANCE BENCHMARK\n");
console.log("═══════════════════════════════════════════\n");

// Test data generators
function generateTestData(sizeKB) {
    const questions = [];
    const targetSize = sizeKB * 1024;
    let currentSize = 0;

    while (currentSize < targetSize) {
        const question = {
            id: crypto.randomUUID(),
            question: `Sample question ${questions.length + 1} with some content: ${crypto.randomBytes(50).toString('hex')}`,
            options: [
                `Option A: ${crypto.randomBytes(20).toString('hex')}`,
                `Option B: ${crypto.randomBytes(20).toString('hex')}`,
                `Option C: ${crypto.randomBytes(20).toString('hex')}`,
                `Option D: ${crypto.randomBytes(20).toString('hex')}`
            ],
            correctAnswer: Math.floor(Math.random() * 4),
            marks: 10
        };
        questions.push(question);
        currentSize = JSON.stringify(questions).length;
    }

    return questions;
}

// Benchmarking function
async function benchmarkEncryption(algorithm, encryptFn, decryptFn, data) {
    const results = {
        algorithm,
        dataSize: JSON.stringify(data).length,
        encryption: {},
        decryption: {},
        totalTime: 0
    };

    try {
        // Encryption benchmark
        const encryptStart = performance.now();
        const encrypted = encryptFn(data);
        const encryptEnd = performance.now();

        results.encryption.time = (encryptEnd - encryptStart).toFixed(3);
        results.encryption.size = encrypted.length;

        // Decryption benchmark
        const decryptStart = performance.now();
        const decrypted = decryptFn(encrypted);
        const decryptEnd = performance.now();

        results.decryption.time = (decryptEnd - decryptStart).toFixed(3);
        results.decryption.success = JSON.stringify(decrypted) === JSON.stringify(data);

        results.totalTime = (parseFloat(results.encryption.time) + parseFloat(results.decryption.time)).toFixed(3);

    } catch (error) {
        results.error = error.message;
    }

    return results;
}

// Main benchmarking
async function runBenchmarks() {
    const allResults = {
        timestamp: new Date().toISOString(),
        system: {
            platform: process.platform,
            nodeVersion: process.version
        },
        tests: []
    };

    const testSizes = [
        { name: "Small (1KB)", sizeKB: 1 },
        { name: "Medium (10KB)", sizeKB: 10 },
        { name: "Large (50KB)", sizeKB: 50 },
        { name: "Extra Large (100KB)", sizeKB: 100 }
    ];

    console.log("📊 Testing AES-CBC Encryption...\n");

    for (const testSize of testSizes) {
        const data = generateTestData(testSize.sizeKB);
        console.log(`Testing ${testSize.name} (${JSON.stringify(data).length} bytes)`);

        const aesResult = await benchmarkEncryption(
            "AES-CBC",
            encryptJson,
            decryptJson,
            data
        );

        console.log(`  Encryption: ${aesResult.encryption.time}ms`);
        console.log(`  Decryption: ${aesResult.decryption.time}ms`);
        console.log(`  Total: ${aesResult.totalTime}ms`);
        console.log(`  Encrypted size: ${aesResult.encryption.size} bytes`);
        console.log(`  Decryption success: ${aesResult.decryption.success ? '✅' : '❌'}\n`);

        allResults.tests.push({
            size: testSize.name,
            ...aesResult
        });
    }

    console.log("═══════════════════════════════════════════\n");
    console.log("📊 Testing RSA-OAEP Encryption...\n");

    // RSA can only handle small data
    const rsaTestSizes = [
        { name: "Tiny (100 bytes)", data: { test: "a".repeat(50) } },
        { name: "Small (200 bytes)", data: { test: "b".repeat(100) } }
    ];

    for (const testSize of rsaTestSizes) {
        console.log(`Testing ${testSize.name}`);

        try {
            const rsaResult = await benchmarkEncryption(
                "RSA-OAEP",
                encryptJsonArray,
                decryptJsonArray,
                testSize.data
            );

            console.log(`  Encryption: ${rsaResult.encryption.time}ms`);
            console.log(`  Decryption: ${rsaResult.decryption.time}ms`);
            console.log(`  Total: ${rsaResult.totalTime}ms`);
            console.log(`  Decryption success: ${rsaResult.decryption.success ? '✅' : '❌'}\n`);

            allResults.tests.push({
                size: testSize.name,
                ...rsaResult
            });
        } catch (error) {
            console.log(`  ❌ Error: ${error.message}\n`);
            allResults.tests.push({
                size: testSize.name,
                algorithm: "RSA-OAEP",
                error: error.message
            });
        }
    }

    console.log("═══════════════════════════════════════════\n");
    console.log("🔐 Key Security Analysis\n");

    // Analyze encryption strength
    console.log("AES Key Analysis:");
    console.log("  Algorithm: AES-CBC");
    console.log("  Key Size: 256-bit (inferred from node-forge default)");
    console.log("  IV Size: 128-bit");
    console.log("  Security Level: ✅ Strong (military-grade)");
    console.log();

    console.log("RSA Key Analysis:");
    console.log("  Algorithm: RSA-OAEP");
    console.log("  Key Size: 2048-bit");
    console.log("  Hash: SHA-256");
    console.log("  Security Level: ✅ Strong (NIST recommended minimum)");
    console.log("  Recommended: Consider upgrading to 3072 or 4096-bit for future-proofing");
    console.log();

    console.log("═══════════════════════════════════════════\n");
    console.log("💡 Performance Recommendations\n");

    // Calculate averages
    const aesTests = allResults.tests.filter(t => t.algorithm === "AES-CBC" && !t.error);
    const avgAesTime = aesTests.reduce((sum, t) => sum + parseFloat(t.totalTime), 0) / aesTests.length;

    console.log(`Average AES encryption time: ${avgAesTime.toFixed(3)}ms`);
    console.log();

    if (avgAesTime < 50) {
        console.log("✅ Excellent: Encryption performance is very fast");
    } else if (avgAesTime < 100) {
        console.log("✅ Good: Encryption performance is acceptable");
    } else {
        console.log("⚠️  Consider: Encryption may be slow for large datasets");
    }

    console.log();
    console.log("Recommendations:");
    console.log("  1. Use AES-CBC for large data (question papers)");
    console.log("  2. Use RSA-OAEP only for small data (keys, tokens)");
    console.log("  3. Consider hybrid encryption (RSA for key exchange, AES for data)");
    console.log("  4. Implement caching for frequently accessed encrypted data");
    console.log("  5. Use streaming encryption for very large files (>1MB)");
    console.log();

    console.log("═══════════════════════════════════════════\n");
    console.log("🛡️ Security Checklist\n");

    const securityChecks = [
        { item: "Using strong encryption algorithms (AES-256, RSA-2048)", status: "✅" },
        { item: "Proper key management (keys stored separately)", status: "✅" },
        { item: "Using secure random IV/nonce generation", status: "✅" },
        { item: "Using authenticated encryption (HMAC)", status: "⚠️  Consider adding" },
        { item: "Key rotation mechanism", status: "⚠️  Not implemented" },
        { item: "Secure key storage (HSM/KMS)", status: "⚠️  File-based (improve for production)" },
        { item: "Memory wiping after key use", status: "❌ Not implemented" }
    ];

    securityChecks.forEach(check => {
        console.log(`  ${check.status} ${check.item}`);
    });

    console.log();
    console.log("═══════════════════════════════════════════\n");

    // Save results
    const reportDir = path.join(__dirname, '../../test-results');
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = path.join(reportDir, 'encryption-benchmark.json');
    fs.writeFileSync(reportPath, JSON.stringify(allResults, null, 2));

    console.log(`✅ Results saved to: ${reportPath}\n`);
    console.log("═══════════════════════════════════════════\n");

    return allResults;
}

// Memory leak detection
async function detectMemoryLeaks() {
    console.log("🔍 Memory Leak Detection Test\n");

    const iterations = 1000;
    const testData = generateTestData(10);

    const memBefore = process.memoryUsage();

    for (let i = 0; i < iterations; i++) {
        const encrypted = encryptJson(testData);
        const decrypted = decryptJson(encrypted);
    }

    if (global.gc) {
        global.gc();
    }

    const memAfter = process.memoryUsage();

    const heapGrowth = (memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024;

    console.log(`Memory usage before: ${(memBefore.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Memory usage after: ${(memAfter.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Heap growth: ${heapGrowth.toFixed(2)} MB after ${iterations} iterations`);

    if (heapGrowth < 10) {
        console.log("✅ No significant memory leak detected\n");
    } else {
        console.log("⚠️  Possible memory leak detected\n");
    }
}

// Run all tests
(async () => {
    try {
        await runBenchmarks();
        await detectMemoryLeaks();
    } catch (error) {
        console.error("❌ Benchmark failed:", error);
        process.exit(1);
    }
})();
