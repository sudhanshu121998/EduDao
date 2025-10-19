const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const {
    measureTransactionTime,
    measureGasOnly,
    measureAverageGas,
    generateMockPaperId,
    generateMockCID,
    generateMockStudentId,
    generateFutureLockTime,
    getCurrentBlockTime,
    increaseTime,
    createMarkdownTable,
    batchStorePapers,
    batchStoreResponses
} = require("./test-helpers");

describe("⚡ EFFICIENCY TESTS - System Performance Evaluation", function () {
    let contract;
    let owner, student1, student2;
    let performanceResults = {};
    let gasResults = {};

    this.timeout(120000); // Set timeout to 2 minutes for performance tests

    before(async () => {
        [owner, student1, student2] = await ethers.getSigners();

        const Contract = await ethers.getContractFactory("TimeLockQuestionPaper");
        contract = await Contract.deploy();
        await contract.waitForDeployment();

        console.log("\n📊 Starting Efficiency Tests...\n");
    });

    describe("📈 Transaction Speed Metrics", () => {
        it("should measure storePaper transaction speed", async () => {
            const paperId = generateMockPaperId(1);
            const cid = generateMockCID();
            const unlockTime = generateFutureLockTime(60);

            const result = await measureTransactionTime(
                contract.storePaper(paperId, cid, unlockTime)
            );

            performanceResults.storePaper = result;

            console.log(`  ⏱️  storePaper: ${result.executionTime}ms, Gas: ${result.gasUsed}`);
            expect(result.executionTime).to.be.lessThan(5000); // Should complete in <5s
        });

        it("should measure storeStudentResponse transaction speed", async () => {
            const paperId = generateMockPaperId(2);
            const studentId = generateMockStudentId(1);
            const cid = generateMockCID();

            const result = await measureTransactionTime(
                contract.storeStudentResponse(paperId, cid, studentId)
            );

            performanceResults.storeStudentResponse = result;

            console.log(`  ⏱️  storeStudentResponse: ${result.executionTime}ms, Gas: ${result.gasUsed}`);
            expect(result.executionTime).to.be.lessThan(5000);
        });

        it("should measure addStudentScore transaction speed", async () => {
            const quizId = generateMockPaperId(3);
            const studentId = generateMockStudentId(2);
            const score = 95;

            const result = await measureTransactionTime(
                contract.addStudentScore(quizId, studentId, score)
            );

            performanceResults.addStudentScore = result;

            console.log(`  ⏱️  addStudentScore: ${result.executionTime}ms, Gas: ${result.gasUsed}`);
            expect(result.executionTime).to.be.lessThan(5000);
        });

        it("should measure storeQuizScore transaction speed", async () => {
            const quizId = generateMockPaperId(4);
            const quizName = "Midterm Exam";
            const studentId = generateMockStudentId(3);
            const score = 88;

            const result = await measureTransactionTime(
                contract.storeQuizScore(quizId, quizName, studentId, score)
            );

            performanceResults.storeQuizScore = result;

            console.log(`  ⏱️  storeQuizScore: ${result.executionTime}ms, Gas: ${result.gasUsed}`);
            expect(result.executionTime).to.be.lessThan(5000);
        });

        it("should measure getPaperCID read operation speed", async () => {
            const paperId = generateMockPaperId(5);
            const cid = generateMockCID();
            const unlockTime = await getCurrentBlockTime() + 10;

            await contract.storePaper(paperId, cid, unlockTime);
            await increaseTime(15);

            const currentTime = await getCurrentBlockTime();
            const startTime = Date.now();
            const retrievedCID = await contract.getPaperCID(paperId, currentTime);
            const endTime = Date.now();

            const readTime = endTime - startTime;
            performanceResults.getPaperCID = { executionTime: readTime, gasUsed: "0 (view)" };

            console.log(`  ⏱️  getPaperCID (read): ${readTime}ms`);
            expect(retrievedCID).to.equal(cid);
            expect(readTime).to.be.lessThan(1000); // Read should be very fast
        });
    });

    describe("⛽ Gas Cost Analysis", () => {
        it("should analyze gas cost for storing papers", async () => {
            const paperId = generateMockPaperId(10);
            const cid = generateMockCID();
            const unlockTime = generateFutureLockTime(60);

            const gasUsed = await measureGasOnly(
                contract.storePaper(paperId, cid, unlockTime)
            );

            gasResults.storePaper = gasUsed;
            console.log(`  ⛽ storePaper gas: ${gasUsed}`);

            // Typical gas limit check
            expect(parseInt(gasUsed)).to.be.lessThan(200000);
        });

        it("should analyze gas cost for storing student responses", async () => {
            const paperId = generateMockPaperId(11);
            const studentId = generateMockStudentId(10);
            const cid = generateMockCID();

            const gasUsed = await measureGasOnly(
                contract.storeStudentResponse(paperId, cid, studentId)
            );

            gasResults.storeStudentResponse = gasUsed;
            console.log(`  ⛽ storeStudentResponse gas: ${gasUsed}`);

            expect(parseInt(gasUsed)).to.be.lessThan(150000);
        });

        it("should analyze gas cost for storing scores", async () => {
            const quizId = generateMockPaperId(12);
            const studentId = generateMockStudentId(11);

            const gasUsed = await measureGasOnly(
                contract.addStudentScore(quizId, studentId, 90)
            );

            gasResults.addStudentScore = gasUsed;
            console.log(`  ⛽ addStudentScore gas: ${gasUsed}`);

            expect(parseInt(gasUsed)).to.be.lessThan(150000);
        });

        it("should analyze gas cost for storing quiz scores", async () => {
            const quizId = generateMockPaperId(13);
            const studentId = generateMockStudentId(12);

            const gasUsed = await measureGasOnly(
                contract.storeQuizScore(quizId, "Final Exam", studentId, 92)
            );

            gasResults.storeQuizScore = gasUsed;
            console.log(`  ⛽ storeQuizScore gas: ${gasUsed}`);

            expect(parseInt(gasUsed)).to.be.lessThan(150000);
        });

        it("should compare gas costs for different CID lengths", async () => {
            const shortCID = "Qm123";
            const normalCID = generateMockCID();
            const longCID = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdGExtendedLongCID";

            const gasShort = await measureGasOnly(
                contract.storePaper(generateMockPaperId(20), shortCID, generateFutureLockTime())
            );

            const gasNormal = await measureGasOnly(
                contract.storePaper(generateMockPaperId(21), normalCID, generateFutureLockTime())
            );

            const gasLong = await measureGasOnly(
                contract.storePaper(generateMockPaperId(22), longCID, generateFutureLockTime())
            );

            console.log(`  ⛽ Short CID gas: ${gasShort}`);
            console.log(`  ⛽ Normal CID gas: ${gasNormal}`);
            console.log(`  ⛽ Long CID gas: ${gasLong}`);

            // Longer strings should cost more gas
            expect(parseInt(gasLong)).to.be.greaterThan(parseInt(gasShort));
        });
    });

    describe("🔄 Concurrent Load Testing", () => {
        it("should handle multiple concurrent paper storage operations", async () => {
            const startTime = Date.now();
            const count = 10;
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
            await Promise.all(txs.map(tx => tx.wait()));

            const endTime = Date.now();
            const totalTime = endTime - startTime;
            const avgTime = totalTime / count;

            console.log(`  🔄 ${count} concurrent papers stored in ${totalTime}ms (avg: ${avgTime.toFixed(2)}ms)`);

            performanceResults.concurrentStorePapers = {
                executionTime: totalTime,
                iterations: count,
                avgTime: avgTime
            };

            expect(totalTime).to.be.lessThan(30000); // Should complete in <30s
        });

        it("should handle multiple concurrent response submissions", async () => {
            const paperId = generateMockPaperId(200);
            const count = 20;
            const startTime = Date.now();
            const promises = [];

            for (let i = 0; i < count; i++) {
                const promise = contract.storeStudentResponse(
                    paperId,
                    generateMockCID(),
                    generateMockStudentId(200 + i)
                );
                promises.push(promise);
            }

            const txs = await Promise.all(promises);
            await Promise.all(txs.map(tx => tx.wait()));

            const endTime = Date.now();
            const totalTime = endTime - startTime;

            console.log(`  🔄 ${count} concurrent responses stored in ${totalTime}ms`);

            performanceResults.concurrentStoreResponses = {
                executionTime: totalTime,
                iterations: count
            };

            expect(totalTime).to.be.lessThan(40000);
        });

        it("should measure performance degradation with increasing data", async () => {
            const results = [];

            // Test with 1, 5, 10, 20 papers
            for (const count of [1, 5, 10, 20]) {
                const startTime = Date.now();

                for (let i = 0; i < count; i++) {
                    const tx = await contract.storePaper(
                        generateMockPaperId(300 + results.length * 100 + i),
                        generateMockCID(),
                        generateFutureLockTime()
                    );
                    await tx.wait();
                }

                const endTime = Date.now();
                const avgTime = (endTime - startTime) / count;

                results.push({
                    count,
                    totalTime: endTime - startTime,
                    avgTime: avgTime.toFixed(2)
                });

                console.log(`  📉 ${count} papers: avg ${avgTime.toFixed(2)}ms per paper`);
            }

            // Performance shouldn't degrade significantly
            const firstAvg = parseFloat(results[0].avgTime);
            const lastAvg = parseFloat(results[results.length - 1].avgTime);
            const degradation = ((lastAvg - firstAvg) / firstAvg) * 100;

            console.log(`  📊 Performance degradation: ${degradation.toFixed(2)}%`);
            expect(degradation).to.be.lessThan(50); // Less than 50% degradation
        });
    });

    describe("📊 Batch Operations Efficiency", () => {
        it("should measure efficiency of batch paper storage", async () => {
            const count = 15;
            const results = await batchStorePapers(contract, count);

            const totalGas = results.reduce((sum, r) => sum + BigInt(r.gasUsed), BigInt(0));
            const avgGas = totalGas / BigInt(count);

            console.log(`  📦 Batch stored ${count} papers`);
            console.log(`  ⛽ Average gas per paper: ${avgGas.toString()}`);

            gasResults.batchStorePapersAvg = avgGas.toString();
            expect(results.length).to.equal(count);
        });

        it("should measure efficiency of batch response storage", async () => {
            const paperId = generateMockPaperId(400);
            const count = 15;
            const results = await batchStoreResponses(contract, paperId, count);

            const totalGas = results.reduce((sum, r) => sum + BigInt(r.gasUsed), BigInt(0));
            const avgGas = totalGas / BigInt(count);

            console.log(`  📦 Batch stored ${count} responses`);
            console.log(`  ⛽ Average gas per response: ${avgGas.toString()}`);

            gasResults.batchStoreResponsesAvg = avgGas.toString();
            expect(results.length).to.equal(count);
        });
    });

    describe("🔍 Read Operation Performance", () => {
        it("should measure getStudentScores retrieval speed with varying data sizes", async () => {
            const quizId = generateMockPaperId(500);

            // Add different numbers of scores
            const counts = [1, 5, 10, 20];
            const results = [];

            for (const count of counts) {
                const testQuizId = `${quizId}_${count}`;

                // Store scores
                for (let i = 0; i < count; i++) {
                    await contract.addStudentScore(testQuizId, generateMockStudentId(500 + i), 80 + i);
                }

                // Measure retrieval time
                const startTime = Date.now();
                const scores = await contract.getStudentScores(testQuizId);
                const endTime = Date.now();

                const retrievalTime = endTime - startTime;
                results.push({ count, retrievalTime });

                console.log(`  🔍 Retrieved ${count} scores in ${retrievalTime}ms`);
            }

            // All retrievals should be fast
            results.forEach(r => {
                expect(r.retrievalTime).to.be.lessThan(1000);
            });
        });

        it("should measure getQuizScores retrieval speed", async () => {
            const studentId = generateMockStudentId(600);
            const count = 10;

            // Store multiple quiz scores for one student
            for (let i = 0; i < count; i++) {
                await contract.storeQuizScore(
                    generateMockPaperId(600 + i),
                    `Quiz ${i}`,
                    studentId,
                    85 + i
                );
            }

            const startTime = Date.now();
            const scores = await contract.getQuizScores(studentId);
            const endTime = Date.now();

            const retrievalTime = endTime - startTime;
            console.log(`  🔍 Retrieved ${count} quiz scores in ${retrievalTime}ms`);

            expect(scores.length).to.equal(count);
            expect(retrievalTime).to.be.lessThan(1000);
        });
    });

    after(async () => {
        console.log("\n\n═══════════════════════════════════════════");
        console.log("📊 EFFICIENCY TEST SUMMARY");
        console.log("═══════════════════════════════════════════\n");

        // Performance Summary
        console.log("⏱️  TRANSACTION SPEED:");
        for (const [name, result] of Object.entries(performanceResults)) {
            if (result.executionTime) {
                console.log(`  ${name.padEnd(30)} ${result.executionTime}ms`);
            }
        }

        // Gas Summary
        console.log("\n⛽ GAS CONSUMPTION:");
        for (const [name, gas] of Object.entries(gasResults)) {
            console.log(`  ${name.padEnd(30)} ${gas}`);
        }

        // Save results to file
        const reportPath = path.join(__dirname, "../test-results");
        if (!fs.existsSync(reportPath)) {
            fs.mkdirSync(reportPath, { recursive: true });
        }

        const report = {
            timestamp: new Date().toISOString(),
            performance: performanceResults,
            gas: gasResults,
            summary: {
                totalTests: Object.keys(performanceResults).length,
                avgTransactionTime: Object.values(performanceResults)
                    .filter(r => r.executionTime)
                    .reduce((sum, r) => sum + r.executionTime, 0) /
                    Object.values(performanceResults).filter(r => r.executionTime).length
            }
        };

        fs.writeFileSync(
            path.join(reportPath, "efficiency-results.json"),
            JSON.stringify(report, null, 2)
        );

        console.log("\n✅ Results saved to test-results/efficiency-results.json");
        console.log("═══════════════════════════════════════════\n");
    });
});
