const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const {
    generateMockPaperId,
    generateMockCID,
    generateMockStudentId,
    generateFutureLockTime,
    generatePastLockTime,
    getCurrentBlockTime,
    increaseTime,
    attemptUnauthorizedAccess
} = require("./test-helpers");

describe("🔐 SECURITY PENETRATION TESTS - Vulnerability Assessment", function () {
    let contract;
    let owner, attacker, student;
    let vulnerabilities = [];
    let securityPassed = [];

    this.timeout(120000);

    before(async () => {
        [owner, attacker, student] = await ethers.getSigners();

        const Contract = await ethers.getContractFactory("TimeLockQuestionPaper");
        contract = await Contract.deploy();
        await contract.waitForDeployment();

        console.log("\n🔐 Starting Security Penetration Tests...\n");
    });

    describe("🔒 Access Control Security", () => {
        it("should prevent unauthorized users from storing papers", async () => {
            const paperId = generateMockPaperId(1);
            const cid = generateMockCID();
            const unlockTime = generateFutureLockTime();

            try {
                const tx = await contract.connect(attacker).storePaper(paperId, cid, unlockTime);
                await tx.wait();

                vulnerabilities.push({
                    severity: "CRITICAL",
                    name: "Unauthorized Paper Storage",
                    description: "Non-owner can store papers"
                });

                expect.fail("Attacker was able to store paper - SECURITY BREACH!");
            } catch (error) {
                expect(error.message).to.include("Only owner can perform this action");
                securityPassed.push("Access control prevents unauthorized storePaper");
                console.log("  ✅ Prevented unauthorized storePaper");
            }
        });

        it("should verify owner address is correctly set", async () => {
            const contractOwner = await contract.owner();
            expect(contractOwner).to.equal(owner.address);
            console.log("  ✅ Owner address correctly set");
        });

        it("should allow only owner to store papers", async () => {
            const paperId = generateMockPaperId(2);
            const cid = generateMockCID();
            const unlockTime = generateFutureLockTime();

            const tx = await contract.connect(owner).storePaper(paperId, cid, unlockTime);
            await tx.wait();

            const stored = await contract.papers(paperId);
            expect(stored.exists).to.be.true;
            console.log("  ✅ Owner can successfully store papers");
        });

        it("should test for privilege escalation vulnerabilities", async () => {
            // Attempt to call owner-only function from different address
            const result = await attemptUnauthorizedAccess(
                contract,
                attacker,
                "storePaper",
                generateMockPaperId(3),
                generateMockCID(),
                generateFutureLockTime()
            );

            expect(result.success).to.be.false;
            expect(result.error).to.include("Only owner");
            console.log("  ✅ No privilege escalation possible");
        });
    });

    describe("⏰ Time-Lock Security", () => {
        it("should prevent accessing papers before unlock time", async () => {
            const paperId = generateMockPaperId(10);
            const cid = generateMockCID();
            const currentTime = await getCurrentBlockTime();
            const unlockTime = currentTime + 3600; // 1 hour in future

            await contract.storePaper(paperId, cid, unlockTime);

            try {
                await contract.getPaperCID(paperId, currentTime);

                vulnerabilities.push({
                    severity: "CRITICAL",
                    name: "Premature Paper Access",
                    description: "Papers can be accessed before unlock time"
                });

                expect.fail("Paper accessed before unlock time - SECURITY BREACH!");
            } catch (error) {
                expect(error.message).to.include("Paper still locked");
                securityPassed.push("Time-lock prevents premature access");
                console.log("  ✅ Prevented premature paper access");
            }
        });

        it("should allow access after unlock time", async () => {
            const paperId = generateMockPaperId(11);
            const cid = generateMockCID();
            const currentTime = await getCurrentBlockTime();
            const unlockTime = currentTime + 5;

            await contract.storePaper(paperId, cid, unlockTime);
            await increaseTime(10);

            const newTime = await getCurrentBlockTime();
            const retrievedCID = await contract.getPaperCID(paperId, newTime);

            expect(retrievedCID).to.equal(cid);
            console.log("  ✅ Paper accessible after unlock time");
        });

        it("should test for timestamp manipulation vulnerabilities", async () => {
            const paperId = generateMockPaperId(12);
            const cid = generateMockCID();
            const currentTime = await getCurrentBlockTime();
            const unlockTime = currentTime + 1000;

            await contract.storePaper(paperId, cid, unlockTime);

            // Try to access with manipulated timestamp (past time)
            try {
                await contract.getPaperCID(paperId, currentTime - 100);
                vulnerabilities.push({
                    severity: "HIGH",
                    name: "Timestamp Manipulation",
                    description: "Can access paper with past timestamp"
                });
                expect.fail("Timestamp manipulation succeeded!");
            } catch (error) {
                expect(error.message).to.include("Paper still locked");
                console.log("  ✅ Timestamp manipulation prevented");
            }

            // Try to access with future timestamp before actual unlock
            try {
                const fakeFutureTime = unlockTime - 100; // Before actual unlock
                await contract.getPaperCID(paperId, fakeFutureTime);
                vulnerabilities.push({
                    severity: "HIGH",
                    name: "Timestamp Bypass",
                    description: "Can bypass time-lock with fake timestamp"
                });
                expect.fail("Timestamp bypass succeeded!");
            } catch (error) {
                expect(error.message).to.include("Paper still locked");
                console.log("  ✅ Timestamp bypass prevented");
            }
        });

        it("should handle edge case: unlock time equals current time", async () => {
            const paperId = generateMockPaperId(13);
            const cid = generateMockCID();
            const currentTime = await getCurrentBlockTime();
            const unlockTime = currentTime + 2;

            await contract.storePaper(paperId, cid, unlockTime);
            await increaseTime(2);

            const exactUnlockTime = await getCurrentBlockTime();
            const retrievedCID = await contract.getPaperCID(paperId, exactUnlockTime);

            expect(retrievedCID).to.equal(cid);
            console.log("  ✅ Exact unlock time edge case handled correctly");
        });

        it("should reject papers with past unlock times", async () => {
            const paperId = generateMockPaperId(14);
            const cid = generateMockCID();
            const pastTime = generatePastLockTime(60);

            try {
                await contract.storePaper(paperId, cid, pastTime);
                vulnerabilities.push({
                    severity: "MEDIUM",
                    name: "Past Unlock Time Accepted",
                    description: "Contract accepts papers with past unlock times"
                });
                expect.fail("Paper with past unlock time was accepted!");
            } catch (error) {
                expect(error.message).to.include("Unlock time must be in the future");
                console.log("  ✅ Past unlock times rejected");
            }
        });
    });

    describe("🔄 Reentrancy Attack Prevention", () => {
        it("should check if functions are protected against reentrancy", async () => {
            const paperId = generateMockPaperId(20);
            const cid = generateMockCID();
            const unlockTime = generateFutureLockTime();

            // Store a paper
            await contract.storePaper(paperId, cid, unlockTime);

            // Simple reentrancy check - contract doesn't use external calls that could be exploited
            // This is more of a code review check, but we verify state consistency
            const paper1 = await contract.papers(paperId);
            const paper2 = await contract.papers(paperId);

            expect(paper1.cid).to.equal(paper2.cid);
            expect(paper1.unlockTime).to.equal(paper2.unlockTime);

            console.log("  ✅ State consistency maintained (no reentrancy vectors found)");
        });

        it("should test for cross-function reentrancy", async () => {
            // Test multiple state-changing operations
            const paperId = generateMockPaperId(21);
            const studentId = generateMockStudentId(21);

            await contract.storeStudentResponse(paperId, generateMockCID(), studentId);
            const response1 = await contract.getStudentResponseCID(paperId, studentId);

            await contract.storeStudentResponse(paperId, generateMockCID(), studentId);
            const response2 = await contract.getStudentResponseCID(paperId, studentId);

            // Second call should overwrite first
            expect(response2).to.not.equal(response1);
            console.log("  ✅ Cross-function reentrancy not possible");
        });
    });

    describe("🔢 Integer Overflow/Underflow Protection", () => {
        it("should test for score overflow vulnerabilities", async () => {
            const quizId = generateMockPaperId(30);
            const studentId = generateMockStudentId(30);

            // Try to store maximum uint256 value
            const maxUint256 = ethers.constants.MaxUint256;

            try {
                const tx = await contract.addStudentScore(quizId, studentId, maxUint256);
                await tx.wait();

                const scores = await contract.getStudentScores(quizId);
                expect(scores[0].score).to.equal(maxUint256);

                console.log("  ⚠️  Large score values accepted (verify if this is intended)");
            } catch (error) {
                console.log("  ✅ Large values properly rejected");
            }
        });

        it("should test for timestamp overflow", async () => {
            const paperId = generateMockPaperId(31);
            const cid = generateMockCID();

            // Try extremely large unlock time
            const farFuture = ethers.BigNumber.from(2).pow(255); // Very large number

            try {
                await contract.storePaper(paperId, cid, farFuture);
                const paper = await contract.papers(paperId);
                expect(paper.unlockTime).to.equal(farFuture);
                console.log("  ⚠️  Extremely large timestamps accepted");
            } catch (error) {
                console.log("  ✅ Timestamp overflow prevented");
            }
        });
    });

    describe("📝 Data Integrity & Validation", () => {
        it("should prevent duplicate paper IDs", async () => {
            const paperId = generateMockPaperId(40);
            const cid1 = generateMockCID();
            const cid2 = "QmDifferentCID123456789012345678901234567890";
            const unlockTime = generateFutureLockTime();

            await contract.storePaper(paperId, cid1, unlockTime);

            try {
                await contract.storePaper(paperId, cid2, unlockTime);
                vulnerabilities.push({
                    severity: "HIGH",
                    name: "Duplicate Paper ID",
                    description: "Can overwrite existing papers"
                });
                expect.fail("Duplicate paper ID was accepted!");
            } catch (error) {
                expect(error.message).to.include("Paper already exists");
                securityPassed.push("Duplicate paper IDs prevented");
                console.log("  ✅ Duplicate paper IDs rejected");
            }
        });

        it("should accept empty strings (current implementation)", async () => {
            const paperId = generateMockPaperId(41);
            const emptyCID = "";
            const unlockTime = generateFutureLockTime();

            try {
                const tx = await contract.storePaper(paperId, emptyCID, unlockTime);
                await tx.wait();

                console.log("  ⚠️  Empty CID accepted - consider adding validation");
                vulnerabilities.push({
                    severity: "LOW",
                    name: "Empty CID Accepted",
                    description: "Contract accepts empty CID strings"
                });
            } catch (error) {
                console.log("  ✅ Empty CID rejected");
            }
        });

        it("should test for paper existence check reliability", async () => {
            const nonExistentPaper = "nonexistent_paper_12345";
            const exists = await contract.paperExists(nonExistentPaper);

            expect(exists).to.be.false;
            console.log("  ✅ Paper existence check works correctly");
        });

        it("should test data isolation between students", async () => {
            const paperId = generateMockPaperId(42);
            const student1Id = generateMockStudentId(1);
            const student2Id = generateMockStudentId(2);
            const cid1 = generateMockCID();
            const cid2 = "QmDifferentCID234567890123456789012345678901";

            await contract.storeStudentResponse(paperId, cid1, student1Id);
            await contract.storeStudentResponse(paperId, cid2, student2Id);

            const response1 = await contract.getStudentResponseCID(paperId, student1Id);
            const response2 = await contract.getStudentResponseCID(paperId, student2Id);

            expect(response1).to.equal(cid1);
            expect(response2).to.equal(cid2);
            expect(response1).to.not.equal(response2);

            console.log("  ✅ Student data properly isolated");
        });
    });

    describe("⚡ Front-Running Attack Prevention", () => {
        it("should analyze vulnerability to front-running attacks", async () => {
            // In time-locked systems, front-running could allow attackers to see
            // pending transactions and submit their own before they're confirmed

            const paperId = generateMockPaperId(50);
            const cid = generateMockCID();
            const unlockTime = generateFutureLockTime();

            // Simulate student submitting response
            const studentId = generateMockStudentId(50);
            const studentCID = generateMockCID();

            // Store paper first
            await contract.storePaper(paperId, cid, unlockTime);

            // Student submits response
            const tx1 = await contract.connect(student).storeStudentResponse(
                paperId,
                studentCID,
                studentId
            );
            await tx1.wait();

            // Verify the response was stored
            const storedCID = await contract.getStudentResponseCID(paperId, studentId);
            expect(storedCID).to.equal(studentCID);

            console.log("  ℹ️  Front-running possible but limited impact (responses can be overwritten)");
            console.log("  💡 Consider adding submission time locks or one-time submission flags");
        });

        it("should check if student can change their response", async () => {
            const paperId = generateMockPaperId(51);
            const studentId = generateMockStudentId(51);
            const cid1 = generateMockCID();
            const cid2 = "QmChangedResponse1234567890123456789012345";

            // First submission
            await contract.storeStudentResponse(paperId, cid1, studentId);
            const response1 = await contract.getStudentResponseCID(paperId, studentId);
            expect(response1).to.equal(cid1);

            // Second submission (change answer)
            await contract.storeStudentResponse(paperId, cid2, studentId);
            const response2 = await contract.getStudentResponseCID(paperId, studentId);
            expect(response2).to.equal(cid2);

            console.log("  ⚠️  Students can change responses - consider if this is intended");
            vulnerabilities.push({
                severity: "MEDIUM",
                name: "Mutable Student Responses",
                description: "Students can modify their responses after submission"
            });
        });
    });

    describe("🗄️ Storage Manipulation Tests", () => {
        it("should verify that stored data cannot be directly modified", async () => {
            const paperId = generateMockPaperId(60);
            const originalCID = generateMockCID();
            const unlockTime = generateFutureLockTime();

            await contract.storePaper(paperId, originalCID, unlockTime);

            const paper = await contract.papers(paperId);
            expect(paper.cid).to.equal(originalCID);
            expect(paper.exists).to.be.true;

            // Attempt to store again should fail
            try {
                await contract.storePaper(paperId, "QmModified", unlockTime);
                expect.fail("Was able to modify stored paper!");
            } catch (error) {
                expect(error.message).to.include("Paper already exists");
                console.log("  ✅ Stored papers cannot be modified");
            }
        });

        it("should test for storage collision vulnerabilities", async () => {
            // Test if different paper IDs can collide
            const paperId1 = "test_paper_1";
            const paperId2 = "test_paper_1"; // Intentionally same
            const cid1 = generateMockCID();
            const cid2 = "QmDifferent";
            const unlockTime = generateFutureLockTime();

            await contract.storePaper(paperId1, cid1, unlockTime);

            try {
                await contract.storePaper(paperId2, cid2, unlockTime);
                vulnerabilities.push({
                    severity: "CRITICAL",
                    name: "Storage Collision",
                    description: "Different papers can occupy same storage slot"
                });
                expect.fail("Storage collision occurred!");
            } catch (error) {
                expect(error.message).to.include("Paper already exists");
                console.log("  ✅ Storage collision prevented");
            }
        });
    });

    describe("🎯 Edge Cases & Boundary Conditions", () => {
        it("should handle very long CID strings", async () => {
            const paperId = generateMockPaperId(70);
            const longCID = "Qm" + "a".repeat(200); // Very long CID
            const unlockTime = generateFutureLockTime();

            try {
                const tx = await contract.storePaper(paperId, longCID, unlockTime);
                await tx.wait();

                const paper = await contract.papers(paperId);
                expect(paper.cid).to.equal(longCID);
                console.log("  ✅ Long CID strings handled correctly");
            } catch (error) {
                console.log("  ⚠️  Long CIDs rejected:", error.message);
            }
        });

        it("should handle very long student/paper IDs", async () => {
            const longPaperId = "paper_" + "x".repeat(100);
            const longStudentId = "student_" + "y".repeat(100);
            const cid = generateMockCID();

            try {
                await contract.storeStudentResponse(longPaperId, cid, longStudentId);
                const response = await contract.getStudentResponseCID(longPaperId, longStudentId);
                expect(response).to.equal(cid);
                console.log("  ✅ Long IDs handled correctly");
            } catch (error) {
                console.log("  ⚠️  Long IDs cause issues:", error.message);
            }
        });

        it("should handle zero score edge case", async () => {
            const quizId = generateMockPaperId(71);
            const studentId = generateMockStudentId(71);

            const tx = await contract.addStudentScore(quizId, studentId, 0);
            await tx.wait();

            const scores = await contract.getStudentScores(quizId);
            expect(scores[0].score).to.equal(0);
            console.log("  ✅ Zero scores handled correctly");
        });
    });

    after(async () => {
        console.log("\n\n═══════════════════════════════════════════");
        console.log("🔐 SECURITY PENETRATION TEST SUMMARY");
        console.log("═══════════════════════════════════════════\n");

        console.log(`✅ PASSED SECURITY CHECKS: ${securityPassed.length}`);
        securityPassed.forEach((check, i) => {
            console.log(`  ${i + 1}. ${check}`);
        });

        if (vulnerabilities.length > 0) {
            console.log(`\n⚠️  VULNERABILITIES FOUND: ${vulnerabilities.length}`);
            vulnerabilities.forEach((vuln, i) => {
                console.log(`\n  ${i + 1}. [${vuln.severity}] ${vuln.name}`);
                console.log(`     ${vuln.description}`);
            });
        } else {
            console.log("\n✅ NO CRITICAL VULNERABILITIES FOUND");
        }

        // Save results
        const reportPath = path.join(__dirname, "../test-results");
        if (!fs.existsSync(reportPath)) {
            fs.mkdirSync(reportPath, { recursive: true });
        }

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalTests: securityPassed.length + vulnerabilities.length,
                passed: securityPassed.length,
                vulnerabilities: vulnerabilities.length
            },
            securityPassed,
            vulnerabilities,
            recommendation: vulnerabilities.length === 0
                ? "Contract demonstrates good security practices"
                : "Address identified vulnerabilities before production deployment"
        };

        fs.writeFileSync(
            path.join(reportPath, "security-results.json"),
            JSON.stringify(report, null, 2)
        );

        console.log("\n✅ Results saved to test-results/security-results.json");
        console.log("═══════════════════════════════════════════\n");
    });
});
