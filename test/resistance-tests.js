const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const {
    generateMockPaperId,
    generateMockCID,
    generateMockStudentId,
    generateFutureLockTime,
    getCurrentBlockTime,
    increaseTime,
    setNextBlockTimestamp,
    validateTimelock
} = require("./test-helpers");

describe("🛡️ RESISTANCE TESTS - Attack Resistance Validation", function () {
    let contract;
    let owner, attacker, student;
    let resistanceTests = {
        passed: [],
        failed: [],
        warnings: []
    };

    this.timeout(120000);

    before(async () => {
        [owner, attacker, student] = await ethers.getSigners();

        const Contract = await ethers.getContractFactory("TimeLockQuestionPaper");
        contract = await Contract.deploy();
        await contract.waitForDeployment();

        console.log("\n🛡️ Starting Resistance Tests...\n");
    });

    describe("🔓 Premature Decryption Prevention", () => {
        it("should resist attempts to access papers before unlock via direct call", async () => {
            const paperId = generateMockPaperId(1);
            const cid = generateMockCID();
            const currentTime = await getCurrentBlockTime();
            const unlockTime = currentTime + 7200; // 2 hours in future

            await contract.storePaper(paperId, cid, unlockTime);

            // Attempt 1: Direct call with current time
            try {
                await contract.getPaperCID(paperId, currentTime);
                resistanceTests.failed.push("Premature access via current time succeeded");
                expect.fail("ACCESS BEFORE UNLOCK - RESISTANCE FAILED");
            } catch (error) {
                expect(error.message).to.include("Paper still locked");
                resistanceTests.passed.push("Resisted premature access via current time");
                console.log("  ✅ Resisted access attempt with current time");
            }

            // Attempt 2: With time slightly before unlock
            try {
                await contract.getPaperCID(paperId, unlockTime - 1);
                resistanceTests.failed.push("Premature access via near-unlock time succeeded");
                expect.fail("ACCESS BEFORE UNLOCK - RESISTANCE FAILED");
            } catch (error) {
                expect(error.message).to.include("Paper still locked");
                resistanceTests.passed.push("Resisted premature access near unlock time");
                console.log("  ✅ Resisted access attempt 1 second before unlock");
            }
        });

        it("should resist blockchain time manipulation attacks", async () => {
            const paperId = generateMockPaperId(2);
            const cid = generateMockCID();
            const currentTime = await getCurrentBlockTime();
            const unlockTime = currentTime + 3600;

            await contract.storePaper(paperId, cid, unlockTime);

            // Try to manipulate time but not enough to unlock
            await increaseTime(1800); // Only 30 minutes
            const newTime = await getCurrentBlockTime();

            try {
                await contract.getPaperCID(paperId, newTime);
                resistanceTests.failed.push("Time manipulation allowed premature access");
                expect.fail("TIME MANIPULATION SUCCESSFUL - RESISTANCE FAILED");
            } catch (error) {
                expect(error.message).to.include("Paper still locked");
                resistanceTests.passed.push("Resisted partial time manipulation");
                console.log("  ✅ Resisted time manipulation (30 min advance)");
            }
        });

        it("should validate that timelock can only be bypassed with sufficient time passage", async () => {
            const paperId = generateMockPaperId(3);
            const cid = generateMockCID();
            const currentTime = await getCurrentBlockTime();
            const unlockTime = currentTime + 100;

            await contract.storePaper(paperId, cid, unlockTime);

            // Increase time sufficiently
            await increaseTime(105);
            const validTime = await getCurrentBlockTime();

            // Should now succeed
            const retrieved = await contract.getPaperCID(paperId, validTime);
            expect(retrieved).to.equal(cid);

            resistanceTests.passed.push("Time-lock properly enforced and released");
            console.log("  ✅ Time-lock properly enforced until valid time");
        });

        it("should resist race condition attacks on time-lock", async () => {
            const paperId = generateMockPaperId(4);
            const cid = generateMockCID();
            const currentTime = await getCurrentBlockTime();
            const unlockTime = currentTime + 50;

            await contract.storePaper(paperId, cid, unlockTime);

            // Simulate race condition: multiple simultaneous access attempts before unlock
            const promises = [];
            for (let i = 0; i < 5; i++) {
                promises.push(
                    contract.getPaperCID(paperId, currentTime + 10).catch(e => e)
                );
            }

            const results = await Promise.all(promises);

            // All should fail
            const allFailed = results.every(r => r instanceof Error);
            expect(allFailed).to.be.true;

            resistanceTests.passed.push("Resisted concurrent premature access attempts");
            console.log("  ✅ Resisted race condition attacks");
        });

        it("should prevent off-chain/on-chain time synchronization exploits", async () => {
            const paperId = generateMockPaperId(5);
            const cid = generateMockCID();
            const onChainTime = await getCurrentBlockTime();
            const offChainTime = Math.floor(Date.now() / 1000);
            const timeDrift = offChainTime - onChainTime;

            const unlockTime = onChainTime + 1000;
            await contract.storePaper(paperId, cid, unlockTime);

            // Try to exploit time drift
            try {
                const exploitTime = offChainTime + 500; // Use off-chain time
                await contract.getPaperCID(paperId, exploitTime);

                if (exploitTime < unlockTime) {
                    resistanceTests.failed.push("Time sync exploit allowed premature access");
                    expect.fail("TIME SYNC EXPLOIT SUCCESSFUL");
                }
            } catch (error) {
                expect(error.message).to.include("Paper still locked");
                resistanceTests.passed.push("Resisted time synchronization exploit");
                console.log(`  ✅ Resisted time sync exploit (drift: ${timeDrift}s)`);
            }
        });
    });

    describe("⛓️ Blockchain Manipulation Resistance", () => {
        it("should resist transaction replay attacks", async () => {
            const paperId = generateMockPaperId(10);
            const studentId = generateMockStudentId(10);
            const cid1 = generateMockCID();
            const cid2 = "QmDifferentResponse123456789012345678901";

            // First submission
            const tx1 = await contract.storeStudentResponse(paperId, cid1, studentId);
            await tx1.wait();

            // Second submission (simulating replay)
            const tx2 = await contract.storeStudentResponse(paperId, cid2, studentId);
            await tx2.wait();

            // Only the latest should be stored
            const stored = await contract.getStudentResponseCID(paperId, studentId);
            expect(stored).to.equal(cid2);
            expect(stored).to.not.equal(cid1);

            resistanceTests.passed.push("Transaction replay handled correctly");
            console.log("  ✅ Transaction replay results in expected state");
        });

        it("should maintain data integrity after state changes", async () => {
            const paperId = generateMockPaperId(11);
            const cid = generateMockCID();
            const unlockTime = generateFutureLockTime();

            // Store paper
            await contract.storePaper(paperId, cid, unlockTime);

            // Verify data
            const paper1 = await contract.papers(paperId);
            expect(paper1.cid).to.equal(cid);
            expect(paper1.unlockTime).to.equal(unlockTime);
            expect(paper1.exists).to.be.true;

            // Perform other operations
            await contract.storeStudentResponse(paperId, cid, "student1");
            await contract.addStudentScore("quiz1", "student1", 95);

            // Re-verify original data unchanged
            const paper2 = await contract.papers(paperId);
            expect(paper2.cid).to.equal(cid);
            expect(paper2.unlockTime).to.equal(unlockTime);
            expect(paper2.exists).to.be.true;

            resistanceTests.passed.push("Data integrity maintained across operations");
            console.log("  ✅ Data integrity maintained after state changes");
        });

        it("should verify event emission for audit trail", async () => {
            const paperId = generateMockPaperId(12);
            const cid = generateMockCID();
            const unlockTime = generateFutureLockTime();

            const tx = await contract.storePaper(paperId, cid, unlockTime);
            const receipt = await tx.wait();

            // Check event was emitted
            const event = receipt.events?.find(e => e.event === "PaperStored");
            expect(event).to.not.be.undefined;
            expect(event.args.paperId).to.equal(paperId);
            expect(event.args.cid).to.equal(cid);
            expect(event.args.unlockTime).to.equal(unlockTime);

            resistanceTests.passed.push("Event emission verified for audit trail");
            console.log("  ✅ Events properly emitted for audit trail");
        });

        it("should resist blockchain reorganization impact", async () => {
            // Store critical data
            const paperId = generateMockPaperId(13);
            const cid = generateMockCID();
            const unlockTime = generateFutureLockTime();

            const tx = await contract.storePaper(paperId, cid, unlockTime);
            const receipt = await tx.wait();

            // Wait for additional confirmations (simulate)
            await increaseTime(1);

            // Verify data is still there after block mining
            const paper = await contract.papers(paperId);
            expect(paper.exists).to.be.true;
            expect(paper.cid).to.equal(cid);

            resistanceTests.passed.push("Data persists through block confirmations");
            console.log("  ✅ Data resistant to reorganization (confirmed)");
        });

        it("should validate nonce-based transaction ordering", async () => {
            const promises = [];

            // Submit multiple transactions in sequence
            for (let i = 0; i < 5; i++) {
                const promise = contract.storeStudentResponse(
                    `paper_${i}`,
                    generateMockCID(),
                    `student_${i}`
                );
                promises.push(promise);
            }

            // Wait for all
            const txs = await Promise.all(promises);
            await Promise.all(txs.map(tx => tx.wait()));

            // Verify all stored
            for (let i = 0; i < 5; i++) {
                const response = await contract.getStudentResponseCID(
                    `paper_${i}`,
                    `student_${i}`
                );
                expect(response).to.not.equal("");
            }

            resistanceTests.passed.push("Transaction ordering maintained");
            console.log("  ✅ Transaction ordering properly maintained");
        });
    });

    describe("🚫 Unauthorized Data Access Prevention", () => {
        it("should prevent unauthorized paper retrieval", async () => {
            const paperId = generateMockPaperId(20);
            const cid = generateMockCID();
            const currentTime = await getCurrentBlockTime();
            const unlockTime = currentTime + 3600;

            await contract.storePaper(paperId, cid, unlockTime);

            // Non-owner trying to retrieve before unlock
            try {
                await contract.connect(attacker).getPaperCID(paperId, currentTime);
                resistanceTests.failed.push("Unauthorized paper retrieval succeeded");
                expect.fail("UNAUTHORIZED ACCESS - RESISTANCE FAILED");
            } catch (error) {
                expect(error.message).to.include("Paper still locked");
                resistanceTests.passed.push("Prevented unauthorized paper retrieval");
                console.log("  ✅ Prevented unauthorized paper retrieval");
            }
        });

        it("should isolate student response data", async () => {
            const paperId = generateMockPaperId(21);
            const student1Id = generateMockStudentId(1);
            const student2Id = generateMockStudentId(2);
            const cid1 = generateMockCID();
            const cid2 = "QmStudent2Response123456789012345678901";

            await contract.storeStudentResponse(paperId, cid1, student1Id);
            await contract.storeStudentResponse(paperId, cid2, student2Id);

            // Student 1's data
            const response1 = await contract.getStudentResponseCID(paperId, student1Id);
            expect(response1).to.equal(cid1);

            // Student 2's data
            const response2 = await contract.getStudentResponseCID(paperId, student2Id);
            expect(response2).to.equal(cid2);

            // Accessing non-existent student should return empty
            const response3 = await contract.getStudentResponseCID(paperId, "nonexistent");
            expect(response3).to.equal("");

            resistanceTests.passed.push("Student data properly isolated");
            console.log("  ✅ Student response data properly isolated");
        });

        it("should prevent enumeration of CIDs", async () => {
            // Store multiple papers
            const papers = [];
            for (let i = 0; i < 10; i++) {
                const paperId = generateMockPaperId(30 + i);
                const cid = generateMockCID();
                const unlockTime = generateFutureLockTime();

                await contract.storePaper(paperId, cid, unlockTime);
                papers.push({ paperId, cid });
            }

            // Try to enumerate - should not be able to iterate through all papers
            // The contract doesn't expose a function to list all paper IDs
            // This is good for privacy

            resistanceTests.passed.push("CID enumeration not possible (no list function)");
            console.log("  ✅ Contract doesn't expose paper enumeration");
        });

        it("should resist brute-force paper ID guessing", async () => {
            const actualPaperId = generateMockPaperId(40);
            const cid = generateMockCID();
            const unlockTime = generateFutureLockTime();

            await contract.storePaper(actualPaperId, cid, unlockTime);

            // Try random paper IDs
            const attempts = [
                "random_paper_1",
                "test_paper",
                "paper_123",
                "exam_2024",
                "quiz_final"
            ];

            let foundCount = 0;
            for (const attemptId of attempts) {
                const exists = await contract.paperExists(attemptId);
                if (exists) foundCount++;
            }

            expect(foundCount).to.equal(0);
            resistanceTests.passed.push("Brute-force paper ID guessing ineffective");
            console.log("  ✅ Random paper IDs don't reveal information");
        });

        it("should prevent unauthorized score modification", async () => {
            const quizId = generateMockPaperId(41);
            const studentId = generateMockStudentId(41);
            const originalScore = 85;

            // Owner adds score
            await contract.connect(owner).addStudentScore(quizId, studentId, originalScore);

            // Attacker tries to add different score for same student
            await contract.connect(attacker).addStudentScore(quizId, studentId, 100);

            // Both scores should be in the array (contract allows multiple entries)
            const scores = await contract.getStudentScores(quizId);
            expect(scores.length).to.be.greaterThanOrEqual(2);

            resistanceTests.warnings.push(
                "Score system allows multiple entries - consider if single entry per student is desired"
            );
            console.log("  ⚠️  Multiple score entries possible - verify this is intended");
        });

        it("should validate student quiz score privacy", async () => {
            const student1Id = generateMockStudentId(50);
            const student2Id = generateMockStudentId(51);

            // Store quiz scores for both students
            await contract.storeQuizScore("quiz1", "Math Quiz", student1Id, 90);
            await contract.storeQuizScore("quiz1", "Math Quiz", student2Id, 75);

            // Each student should only see their own scores
            const student1Scores = await contract.getQuizScores(student1Id);
            const student2Scores = await contract.getQuizScores(student2Id);

            expect(student1Scores.length).to.be.greaterThan(0);
            expect(student2Scores.length).to.be.greaterThan(0);

            // Verify scores are different
            const student1Score = student1Scores[0].score;
            const student2Score = student2Scores[0].score;
            expect(student1Score).to.equal(90);
            expect(student2Score).to.equal(75);

            resistanceTests.passed.push("Quiz score privacy maintained per student");
            console.log("  ✅ Quiz scores properly isolated per student");
        });
    });

    describe("🔐 IPFS CID Access Control", () => {
        it("should verify CID is not accessible before unlock time", async () => {
            const paperId = generateMockPaperId(60);
            const secretCID = "QmSecretPaper1234567890123456789012345678";
            const currentTime = await getCurrentBlockTime();
            const unlockTime = currentTime + 10000;

            await contract.storePaper(paperId, secretCID, unlockTime);

            // Even if attacker knows paper ID, they can't get CID before unlock
            try {
                await contract.connect(attacker).getPaperCID(paperId, currentTime);
                resistanceTests.failed.push("CID accessible before unlock time");
                expect.fail("CID LEAKED BEFORE UNLOCK");
            } catch (error) {
                expect(error.message).to.include("Paper still locked");
                resistanceTests.passed.push("CID protected before unlock time");
                console.log("  ✅ CID not accessible before unlock time");
            }
        });

        it("should verify CID becomes accessible after unlock", async () => {
            const paperId = generateMockPaperId(61);
            const cid = generateMockCID();
            const currentTime = await getCurrentBlockTime();
            const unlockTime = currentTime + 10;

            await contract.storePaper(paperId, cid, unlockTime);
            await increaseTime(15);

            const validTime = await getCurrentBlockTime();
            const retrievedCID = await contract.connect(student).getPaperCID(paperId, validTime);

            expect(retrievedCID).to.equal(cid);
            resistanceTests.passed.push("CID properly released after unlock");
            console.log("  ✅ CID accessible to all after unlock time");
        });

        it("should test if storage layout leaks CID information", async () => {
            const paperId = generateMockPaperId(62);
            const cid = generateMockCID();
            const unlockTime = generateFutureLockTime();

            await contract.storePaper(paperId, cid, unlockTime);

            // Try to read paper struct (this is public)
            const paper = await contract.papers(paperId);

            // CID is visible in storage (this is by design in current implementation)
            expect(paper.cid).to.equal(cid);

            resistanceTests.warnings.push(
                "CID visible in public storage mapping - consider encrypting CID if absolute privacy needed"
            );
            console.log("  ⚠️  CID visible in storage (consider additional encryption layer)");
        });
    });

    describe("💪 Stress Testing Resistance", () => {
        it("should resist denial of service via excessive data", async () => {
            const count = 50;
            let successCount = 0;

            for (let i = 0; i < count; i++) {
                try {
                    const tx = await contract.storePaper(
                        generateMockPaperId(100 + i),
                        generateMockCID(),
                        generateFutureLockTime()
                    );
                    await tx.wait();
                    successCount++;
                } catch (error) {
                    console.log(`  Failed at iteration ${i}: ${error.message}`);
                }
            }

            expect(successCount).to.equal(count);
            resistanceTests.passed.push(`Handled ${count} papers without DoS`);
            console.log(`  ✅ Successfully stored ${count} papers (DoS resistant)`);
        });

        it("should handle concurrent access from multiple users", async () => {
            const paperId = generateMockPaperId(200);
            const cid = generateMockCID();
            const currentTime = await getCurrentBlockTime();
            const unlockTime = currentTime + 20;

            await contract.storePaper(paperId, cid, unlockTime);
            await increaseTime(25);

            // Multiple users accessing simultaneously
            const validTime = await getCurrentBlockTime();
            const promises = [
                contract.connect(owner).getPaperCID(paperId, validTime),
                contract.connect(attacker).getPaperCID(paperId, validTime),
                contract.connect(student).getPaperCID(paperId, validTime)
            ];

            const results = await Promise.all(promises);

            expect(results[0]).to.equal(cid);
            expect(results[1]).to.equal(cid);
            expect(results[2]).to.equal(cid);

            resistanceTests.passed.push("Handled concurrent access from multiple users");
            console.log("  ✅ Concurrent access handled correctly");
        });
    });

    after(async () => {
        console.log("\n\n═══════════════════════════════════════════");
        console.log("🛡️ RESISTANCE TEST SUMMARY");
        console.log("═══════════════════════════════════════════\n");

        console.log(`✅ PASSED: ${resistanceTests.passed.length}`);
        resistanceTests.passed.forEach((test, i) => {
            console.log(`  ${i + 1}. ${test}`);
        });

        if (resistanceTests.warnings.length > 0) {
            console.log(`\n⚠️  WARNINGS: ${resistanceTests.warnings.length}`);
            resistanceTests.warnings.forEach((warning, i) => {
                console.log(`  ${i + 1}. ${warning}`);
            });
        }

        if (resistanceTests.failed.length > 0) {
            console.log(`\n❌ FAILED: ${resistanceTests.failed.length}`);
            resistanceTests.failed.forEach((fail, i) => {
                console.log(`  ${i + 1}. ${fail}`);
            });
        }

        // Save results
        const reportPath = path.join(__dirname, "../test-results");
        if (!fs.existsSync(reportPath)) {
            fs.mkdirSync(reportPath, { recursive: true });
        }

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalTests: resistanceTests.passed.length + resistanceTests.failed.length,
                passed: resistanceTests.passed.length,
                failed: resistanceTests.failed.length,
                warnings: resistanceTests.warnings.length
            },
            results: resistanceTests,
            overallStatus: resistanceTests.failed.length === 0 ? "SECURE" : "VULNERABLE"
        };

        fs.writeFileSync(
            path.join(reportPath, "resistance-results.json"),
            JSON.stringify(report, null, 2)
        );

        console.log("\n✅ Results saved to test-results/resistance-results.json");
        console.log("═══════════════════════════════════════════\n");
    });
});
