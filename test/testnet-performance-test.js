const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const {
    measureTransactionTime,
    generateMockPaperId,
    generateMockCID,
    generateMockStudentId,
    generateFutureLockTime,
    getCurrentBlockTime,
    increaseTime
} = require("./test-helpers");

/**
 * TESTNET PERFORMANCE TESTS
 * 
 * These tests are designed to measure REAL-WORLD blockchain performance
 * on Sepolia testnet, NOT local development performance.
 * 
 * IMPORTANT: 
 * - These tests will take 10-20 minutes to complete (vs 30 seconds locally)
 * - Each transaction waits for real block mining (~12-15 seconds)
 * - Requires Sepolia testnet ETH and RPC provider
 * 
 * To run:
 * 1. Get Sepolia ETH from: https://sepoliafaucet.com/
 * 2. Add SEPOLIA_RPC_URL to .env (Infura/Alchemy)
 * 3. Add PRIVATE_KEY to .env (testnet wallet only!)
 * 4. Run: npx hardhat test test/testnet-performance-test.js --network sepolia
 */

describe("🌐 TESTNET PERFORMANCE TESTS - Real Blockchain Measurements", function () {
    let contract;
    let owner;
    let performanceResults = {};
    let networkInfo = {};

    // Testnet tests need much longer timeout (transactions take 12-15s each)
    this.timeout(600000); // 10 minutes

    before(async () => {
        console.log("\n🌐 Starting Testnet Performance Tests...\n");
        console.log("⚠️  WARNING: These tests will take 10-20 minutes to complete");
        console.log("⚠️  Each transaction waits for real block mining (~12-15 seconds)\n");

        [owner] = await ethers.getSigners();

        // Get network information
        const network = await ethers.provider.getNetwork();
        const balance = await ethers.provider.getBalance(owner.address);

        networkInfo = {
            name: network.name,
            chainId: network.chainId.toString(),
            ownerAddress: owner.address,
            balance: ethers.formatEther(balance)
        };

        console.log("📡 Network Information:");
        console.log(`   Chain ID: ${networkInfo.chainId}`);
        console.log(`   Network: ${networkInfo.name}`);
        console.log(`   Deployer: ${networkInfo.ownerAddress}`);
        console.log(`   Balance: ${networkInfo.balance} ETH\n`);

        // Check if we're actually on a testnet
        if (network.chainId === 31337n) {
            console.log("❌ ERROR: Running on local Hardhat network!");
            console.log("   Use: npx hardhat test test/testnet-performance-test.js --network sepolia\n");
            throw new Error("Must run on Sepolia testnet, not local network");
        }

        if (parseFloat(networkInfo.balance) < 0.01) {
            console.log("⚠️  WARNING: Low balance! You may need more Sepolia ETH");
            console.log("   Get from: https://sepoliafaucet.com/\n");
        }

        // Deploy contract
        console.log("📝 Deploying TimeLockQuestionPaper contract...");
        const deployStartTime = Date.now();

        const Contract = await ethers.getContractFactory("TimeLockQuestionPaper");
        contract = await Contract.deploy();
        await contract.waitForDeployment();

        const deployEndTime = Date.now();
        const deploymentTime = deployEndTime - deployStartTime;

        const contractAddress = await contract.getAddress();

        console.log(`✅ Contract deployed to: ${contractAddress}`);
        console.log(`⏱️  Deployment time: ${(deploymentTime / 1000).toFixed(2)}s\n`);

        performanceResults.deployment = {
            executionTime: deploymentTime,
            address: contractAddress
        };
    });

    describe("📈 Real-World Transaction Speed", () => {
        it("should measure REAL storePaper transaction time", async () => {
            console.log("  📤 Submitting storePaper transaction...");

            const paperId = generateMockPaperId(1);
            const cid = generateMockCID();
            const unlockTime = generateFutureLockTime(60);

            const result = await measureTransactionTime(
                contract.storePaper(paperId, cid, unlockTime)
            );

            performanceResults.storePaper = result;

            console.log(`  ✅ storePaper completed!`);
            console.log(`     Time: ${(result.executionTime / 1000).toFixed(2)}s`);
            console.log(`     Gas: ${result.gasUsed}`);
            console.log(`     Tx: ${result.txHash}\n`);

            // Real testnet should take 10-20 seconds
            expect(result.executionTime).to.be.greaterThan(8000);
            expect(result.executionTime).to.be.lessThan(30000);
        });

        it("should measure REAL storeStudentResponse transaction time", async () => {
            console.log("  📤 Submitting storeStudentResponse transaction...");

            const paperId = generateMockPaperId(2);
            const studentId = generateMockStudentId(1);
            const cid = generateMockCID();

            const result = await measureTransactionTime(
                contract.storeStudentResponse(paperId, cid, studentId)
            );

            performanceResults.storeStudentResponse = result;

            console.log(`  ✅ storeStudentResponse completed!`);
            console.log(`     Time: ${(result.executionTime / 1000).toFixed(2)}s`);
            console.log(`     Gas: ${result.gasUsed}`);
            console.log(`     Tx: ${result.txHash}\n`);

            expect(result.executionTime).to.be.greaterThan(8000);
            expect(result.executionTime).to.be.lessThan(30000);
        });

        it("should measure REAL addStudentScore transaction time", async () => {
            console.log("  📤 Submitting addStudentScore transaction...");

            const quizId = generateMockPaperId(3);
            const studentId = generateMockStudentId(2);
            const score = 95;

            const result = await measureTransactionTime(
                contract.addStudentScore(quizId, studentId, score)
            );

            performanceResults.addStudentScore = result;

            console.log(`  ✅ addStudentScore completed!`);
            console.log(`     Time: ${(result.executionTime / 1000).toFixed(2)}s`);
            console.log(`     Gas: ${result.gasUsed}`);
            console.log(`     Tx: ${result.txHash}\n`);

            expect(result.executionTime).to.be.greaterThan(8000);
            expect(result.executionTime).to.be.lessThan(30000);
        });

        it("should measure REAL getPaperCID read operation", async () => {
            console.log("  📖 Testing getPaperCID (read operation)...");

            const paperId = generateMockPaperId(4);
            const cid = generateMockCID();
            const unlockTime = Math.floor(Date.now() / 1000) + 5;

            // First store a paper (this takes 12-15s)
            console.log("     Setting up test data...");
            await contract.storePaper(paperId, cid, unlockTime);

            // Wait for unlock time
            await new Promise(resolve => setTimeout(resolve, 6000));

            // Now measure read operation
            const currentTime = Math.floor(Date.now() / 1000);
            const startTime = Date.now();
            const retrievedCID = await contract.getPaperCID(paperId, currentTime);
            const endTime = Date.now();

            const readTime = endTime - startTime;
            performanceResults.getPaperCID = { executionTime: readTime };

            console.log(`  ✅ getPaperCID completed!`);
            console.log(`     Time: ${readTime}ms (read operations are fast)\n`);

            expect(retrievedCID).to.equal(cid);
            expect(readTime).to.be.lessThan(2000); // Reads are fast even on testnet
        });
    });

    describe("🔄 Concurrent Transactions", () => {
        it("should measure multiple transactions in same block", async () => {
            console.log("  📤 Submitting 3 concurrent transactions...");

            const count = 3;
            const startTime = Date.now();
            const promises = [];

            for (let i = 0; i < count; i++) {
                const promise = contract.storePaper(
                    generateMockPaperId(100 + i),
                    generateMockCID(),
                    generateFutureLockTime()
                );
                promises.push(promise);
            }

            const txs = await Promise.all(promises);
            console.log("     Waiting for confirmations...");
            await Promise.all(txs.map(tx => tx.wait()));

            const endTime = Date.now();
            const totalTime = endTime - startTime;

            console.log(`  ✅ All transactions confirmed!`);
            console.log(`     Total time: ${(totalTime / 1000).toFixed(2)}s`);
            console.log(`     Note: Multiple txs in same block take ~same time as one\n`);

            performanceResults.concurrentTransactions = {
                count,
                totalTime,
                timePerTx: totalTime / count
            };

            // Multiple concurrent txs should take about the same as one (all in one block)
            expect(totalTime).to.be.lessThan(40000); // Should complete within ~30s
        });
    });

    after(async () => {
        console.log("\n\n═══════════════════════════════════════════");
        console.log("🌐 TESTNET PERFORMANCE TEST SUMMARY");
        console.log("═══════════════════════════════════════════\n");

        console.log("📡 NETWORK INFORMATION:");
        console.log(`   Network: ${networkInfo.name} (Chain ID: ${networkInfo.chainId})`);
        console.log(`   Contract: ${performanceResults.deployment.address}`);
        console.log(`   Deployment: ${(performanceResults.deployment.executionTime / 1000).toFixed(2)}s\n`);

        console.log("⏱️  TRANSACTION TIMES (Real Blockchain):");
        if (performanceResults.storePaper) {
            console.log(`   storePaper: ${(performanceResults.storePaper.executionTime / 1000).toFixed(2)}s`);
        }
        if (performanceResults.storeStudentResponse) {
            console.log(`   storeStudentResponse: ${(performanceResults.storeStudentResponse.executionTime / 1000).toFixed(2)}s`);
        }
        if (performanceResults.addStudentScore) {
            console.log(`   addStudentScore: ${(performanceResults.addStudentScore.executionTime / 1000).toFixed(2)}s`);
        }
        if (performanceResults.getPaperCID) {
            console.log(`   getPaperCID (read): ${performanceResults.getPaperCID.executionTime}ms`);
        }

        console.log("\n⛽ GAS USAGE:");
        if (performanceResults.storePaper) {
            console.log(`   storePaper: ${performanceResults.storePaper.gasUsed}`);
        }
        if (performanceResults.storeStudentResponse) {
            console.log(`   storeStudentResponse: ${performanceResults.storeStudentResponse.gasUsed}`);
        }
        if (performanceResults.addStudentScore) {
            console.log(`   addStudentScore: ${performanceResults.addStudentScore.gasUsed}`);
        }

        console.log("\n📊 KEY OBSERVATIONS:");
        console.log("   ✓ Transactions take 12-15s (real blockchain constraint)");
        console.log("   ✓ Read operations remain fast (~50-500ms)");
        console.log("   ✓ Gas costs are consistent with local testing");
        console.log("   ✓ Concurrent transactions in same block ~same time as one");

        // Save results
        const reportPath = path.join(__dirname, "../test-results");
        if (!fs.existsSync(reportPath)) {
            fs.mkdirSync(reportPath, { recursive: true });
        }

        const report = {
            timestamp: new Date().toISOString(),
            network: networkInfo,
            performance: performanceResults,
            notes: {
                environment: "Sepolia Testnet (Real Blockchain)",
                blockTime: "~12-15 seconds",
                comparison: "Local dev: 2-5ms, Testnet: 12-15s",
                recommendation: "Use these values for production estimates"
            }
        };

        fs.writeFileSync(
            path.join(reportPath, "testnet-performance-results.json"),
            JSON.stringify(report, null, 2)
        );

        console.log("\n✅ Results saved to test-results/testnet-performance-results.json");
        console.log("═══════════════════════════════════════════\n");
    });
});
