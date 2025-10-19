const { ethers } = require("hardhat");

/**
 * Time Manipulation Helpers
 */
async function increaseTime(seconds) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine");
}

async function getCurrentBlockTime() {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp;
}

async function setNextBlockTimestamp(timestamp) {
    await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp]);
    await ethers.provider.send("evm_mine");
}

/**
 * Performance Measurement Helpers
 */
async function measureTransactionTime(txPromise) {
    const startTime = Date.now();
    const tx = await txPromise;
    const receipt = await tx.wait();
    const endTime = Date.now();

    return {
        executionTime: endTime - startTime,
        gasUsed: receipt.gasUsed.toString(),
        txHash: receipt.transactionHash,
        receipt
    };
}

/**
 * Measure transaction time with network context
 */
async function measureTransactionTimeWithContext(txPromise) {
    const networkInfo = await getNetworkInfo();
    const result = await measureTransactionTime(txPromise);

    return {
        ...result,
        network: networkInfo,
        estimatedProductionTime: estimateProductionTime(result.executionTime, networkInfo.isLocal)
    };
}

/**
 * Get network information to understand measurement context
 */
async function getNetworkInfo() {
    const { ethers } = require("hardhat");
    const network = await ethers.provider.getNetwork();

    return {
        chainId: network.chainId.toString(),
        name: network.name,
        isLocal: network.chainId === 31337n,
        isTestnet: network.chainId === 11155111n, // Sepolia
        isMainnet: network.chainId === 1n
    };
}

/**
 * Estimate production blockchain time based on local measurements
 */
function estimateProductionTime(localTime, isLocal = true) {
    if (!isLocal) {
        return localTime; // Already measuring production
    }

    // Local measurements are ~2-5ms, production is ~12-15s
    // This is a rough estimate for reporting purposes
    return {
        ethereumMainnet: "12-15 seconds (average block time)",
        ethereumTestnet: "12-15 seconds (average block time)",
        layer2: "1-3 seconds (faster block time)",
        note: "Production times are constrained by blockchain block time, not smart contract efficiency"
    };
}


async function measureGasOnly(txPromise) {
    const tx = await txPromise;
    const receipt = await tx.wait();
    return receipt.gasUsed.toString();
}

async function measureAverageGas(txPromiseFunc, iterations = 10) {
    let totalGas = BigInt(0);

    for (let i = 0; i < iterations; i++) {
        const tx = await txPromiseFunc(i);
        const receipt = await tx.wait();
        totalGas += receipt.gasUsed;
    }

    return (totalGas / BigInt(iterations)).toString();
}

/**
 * Mock Data Generators
 */
function generateMockPaperId(index = 0) {
    return `paper_${Date.now()}_${index}`;
}

function generateMockCID(size = "small") {
    const cids = {
        small: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
        medium: "QmPZ9gcCEpqKTo6aq61g2nXGUhM4iCL3ewB6LDXZCtioEB",
        large: "QmRN6F3c9CwKC3K7xBr3jZ8v2k9qPk3xQP3X9d4K6L7sZx"
    };
    return cids[size] || cids.small;
}

function generateMockStudentId(index = 0) {
    return `student_${index}`;
}

function generateFutureLockTime(minutesFromNow = 60) {
    return Math.floor(Date.now() / 1000) + (minutesFromNow * 60);
}

function generatePastLockTime(minutesAgo = 60) {
    return Math.floor(Date.now() / 1000) - (minutesAgo * 60);
}

/**
 * Security Attack Simulation Helpers
 */
async function attemptUnauthorizedAccess(contract, signer, functionName, ...args) {
    try {
        const tx = await contract.connect(signer)[functionName](...args);
        await tx.wait();
        return { success: true, error: null };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function simulateReentrancy(attackContract, targetContract) {
    try {
        const tx = await attackContract.attack(targetContract.address);
        await tx.wait();
        return { success: true, exploited: true };
    } catch (error) {
        return { success: false, exploited: false, error: error.message };
    }
}

/**
 * Report Generation Helpers
 */
function formatGasReport(results) {
    let report = "\n=== GAS CONSUMPTION REPORT ===\n\n";

    for (const [functionName, gasUsed] of Object.entries(results)) {
        const gasInEth = ethers.utils.formatEther(gasUsed);
        report += `${functionName.padEnd(30)} ${gasUsed.toString().padStart(10)} gas (${gasInEth} ETH)\n`;
    }

    return report;
}

function formatPerformanceReport(results) {
    let report = "\n=== PERFORMANCE REPORT ===\n\n";

    for (const [testName, metrics] of Object.entries(results)) {
        report += `\n${testName}:\n`;
        report += `  Execution Time: ${metrics.executionTime}ms\n`;
        report += `  Gas Used: ${metrics.gasUsed}\n`;
        if (metrics.iterations) {
            report += `  Iterations: ${metrics.iterations}\n`;
            report += `  Avg Time: ${(metrics.executionTime / metrics.iterations).toFixed(2)}ms\n`;
        }
    }

    return report;
}

function createMarkdownTable(headers, rows) {
    let table = `| ${headers.join(' | ')} |\n`;
    table += `| ${headers.map(() => '---').join(' | ')} |\n`;

    for (const row of rows) {
        table += `| ${row.join(' | ')} |\n`;
    }

    return table;
}

/**
 * Validation Helpers
 */
function validateTimelock(unlockTime, currentTime) {
    return currentTime >= unlockTime;
}

function validateCID(cid) {
    // Basic CID validation (IPFS v0 format)
    return /^Qm[a-zA-Z0-9]{44}$/.test(cid);
}

async function waitForTransaction(tx, confirmations = 1) {
    const receipt = await tx.wait(confirmations);
    return receipt;
}

/**
 * Batch Operation Helpers
 */
async function batchStorePapers(contract, count = 10) {
    const results = [];
    const baseTime = await getCurrentBlockTime();

    for (let i = 0; i < count; i++) {
        const paperId = generateMockPaperId(i);
        const cid = generateMockCID();
        const unlockTime = baseTime + 3600 + i;

        const tx = await contract.storePaper(paperId, cid, unlockTime);
        const receipt = await tx.wait();

        results.push({
            paperId,
            gasUsed: receipt.gasUsed.toString(),
            txHash: receipt.transactionHash
        });
    }

    return results;
}

async function batchStoreResponses(contract, paperId, studentCount = 10) {
    const results = [];

    for (let i = 0; i < studentCount; i++) {
        const studentId = generateMockStudentId(i);
        const cid = generateMockCID();

        const tx = await contract.storeStudentResponse(paperId, cid, studentId);
        const receipt = await tx.wait();

        results.push({
            studentId,
            gasUsed: receipt.gasUsed.toString()
        });
    }

    return results;
}

module.exports = {
    // Time manipulation
    increaseTime,
    getCurrentBlockTime,
    setNextBlockTimestamp,

    // Performance measurement
    measureTransactionTime,
    measureTransactionTimeWithContext,
    measureGasOnly,
    measureAverageGas,

    // Network detection
    getNetworkInfo,
    estimateProductionTime,

    // Mock data generation
    generateMockPaperId,
    generateMockCID,
    generateMockStudentId,
    generateFutureLockTime,
    generatePastLockTime,

    // Security testing
    attemptUnauthorizedAccess,
    simulateReentrancy,

    // Report generation
    formatGasReport,
    formatPerformanceReport,
    createMarkdownTable,

    // Validation
    validateTimelock,
    validateCID,
    waitForTransaction,

    // Batch operations
    batchStorePapers,
    batchStoreResponses
};
