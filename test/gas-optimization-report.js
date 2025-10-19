const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const {
    generateMockPaperId,
    generateMockCID,
    generateMockStudentId,
    generateFutureLockTime,
    measureGasOnly,
    createMarkdownTable
} = require("./test-helpers");

describe("⛽ GAS OPTIMIZATION REPORT - Blockchain Storage Cost Analysis", function () {
    let contract;
    let owner;
    let gasData = {
        functions: {},
        comparisons: {},
        recommendations: []
    };

    this.timeout(120000);

    before(async () => {
        [owner] = await ethers.getSigners();

        const Contract = await ethers.getContractFactory("TimeLockQuestionPaper");
        contract = await Contract.deploy();
        await contract.waitForDeployment();

        console.log("\n⛽ Starting Gas Optimization Analysis...\n");
    });

    describe("📊 Per-Function Gas Consumption", () => {
        it("should measure storePaper gas costs", async () => {
            const samples = [];

            for (let i = 0; i < 5; i++) {
                const gas = await measureGasOnly(
                    contract.storePaper(
                        generateMockPaperId(i),
                        generateMockCID(),
                        generateFutureLockTime()
                    )
                );
                samples.push(parseInt(gas));
            }

            const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
            gasData.functions.storePaper = {
                samples,
                average: Math.floor(avg),
                min: Math.min(...samples),
                max: Math.max(...samples)
            };

            console.log(`  storePaper: avg ${Math.floor(avg)} gas (${samples.length} samples)`);
        });

        it("should measure storeStudentResponse gas costs", async () => {
            const samples = [];

            for (let i = 0; i < 5; i++) {
                const gas = await measureGasOnly(
                    contract.storeStudentResponse(
                        generateMockPaperId(10 + i),
                        generateMockCID(),
                        generateMockStudentId(i)
                    )
                );
                samples.push(parseInt(gas));
            }

            const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
            gasData.functions.storeStudentResponse = {
                samples,
                average: Math.floor(avg),
                min: Math.min(...samples),
                max: Math.max(...samples)
            };

            console.log(`  storeStudentResponse: avg ${Math.floor(avg)} gas`);
        });

        it("should measure addStudentScore gas costs", async () => {
            const samples = [];

            for (let i = 0; i < 5; i++) {
                const gas = await measureGasOnly(
                    contract.addStudentScore(
                        generateMockPaperId(20 + i),
                        generateMockStudentId(10 + i),
                        85 + i
                    )
                );
                samples.push(parseInt(gas));
            }

            const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
            gasData.functions.addStudentScore = {
                samples,
                average: Math.floor(avg),
                min: Math.min(...samples),
                max: Math.max(...samples)
            };

            console.log(`  addStudentScore: avg ${Math.floor(avg)} gas`);
        });

        it("should measure storeQuizScore gas costs", async () => {
            const samples = [];

            for (let i = 0; i < 5; i++) {
                const gas = await measureGasOnly(
                    contract.storeQuizScore(
                        generateMockPaperId(30 + i),
                        `Quiz ${i}`,
                        generateMockStudentId(20 + i),
                        90 + i
                    )
                );
                samples.push(parseInt(gas));
            }

            const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
            gasData.functions.storeQuizScore = {
                samples,
                average: Math.floor(avg),
                min: Math.min(...samples),
                max: Math.max(...samples)
            };

            console.log(`  storeQuizScore: avg ${Math.floor(avg)} gas`);
        });
    });

    describe("📏 String Length Impact on Gas", () => {
        it("should compare gas costs for different CID lengths", async () => {
            const testCases = [
                { name: "Short CID (10 chars)", cid: "Qm12345678" },
                { name: "Normal CID (46 chars)", cid: generateMockCID() },
                { name: "Long CID (80 chars)", cid: "Qm" + "x".repeat(78) }
            ];

            const results = [];
            for (const test of testCases) {
                const gas = await measureGasOnly(
                    contract.storePaper(
                        `paper_cid_${test.name}`,
                        test.cid,
                        generateFutureLockTime()
                    )
                );
                results.push({ name: test.name, gas: parseInt(gas), length: test.cid.length });
                console.log(`  ${test.name}: ${gas} gas (${test.cid.length} chars)`);
            }

            gasData.comparisons.cidLength = results;

            // Calculate gas per character
            const gasPerChar = (results[2].gas - results[0].gas) / (results[2].length - results[0].length);
            console.log(`  Est. gas per additional character: ~${Math.floor(gasPerChar)}`);
        });

        it("should compare gas costs for different paper ID lengths", async () => {
            const testCases = [
                { name: "Short ID", id: "p1" },
                { name: "Medium ID", id: "paper_medium_12345" },
                { name: "Long ID", id: "very_long_paper_id_with_many_characters_12345" }
            ];

            const results = [];
            for (const test of testCases) {
                const gas = await measureGasOnly(
                    contract.storePaper(
                        test.id,
                        generateMockCID(),
                        generateFutureLockTime()
                    )
                );
                results.push({ name: test.name, gas: parseInt(gas), length: test.id.length });
                console.log(`  ${test.name}: ${gas} gas (${test.id.length} chars)`);
            }

            gasData.comparisons.paperIdLength = results;
        });
    });

    describe("🔄 Sequential vs Batch Operations", () => {
        it("should measure cumulative gas for multiple papers", async () => {
            const counts = [1, 5, 10];
            const results = [];

            for (const count of counts) {
                let totalGas = 0;

                for (let i = 0; i < count; i++) {
                    const gas = await measureGasOnly(
                        contract.storePaper(
                            generateMockPaperId(100 + i),
                            generateMockCID(),
                            generateFutureLockTime()
                        )
                    );
                    totalGas += parseInt(gas);
                }

                const avgGas = Math.floor(totalGas / count);
                results.push({ count, totalGas, avgGas });
                console.log(`  ${count} papers: ${totalGas} total gas, ${avgGas} avg per paper`);
            }

            gasData.comparisons.batchPapers = results;
        });

        it("should measure cumulative gas for multiple responses", async () => {
            const paperId = generateMockPaperId(200);
            const counts = [1, 5, 10];
            const results = [];

            for (const count of counts) {
                let totalGas = 0;

                for (let i = 0; i < count; i++) {
                    const gas = await measureGasOnly(
                        contract.storeStudentResponse(
                            paperId,
                            generateMockCID(),
                            generateMockStudentId(200 + i)
                        )
                    );
                    totalGas += parseInt(gas);
                }

                const avgGas = Math.floor(totalGas / count);
                results.push({ count, totalGas, avgGas });
                console.log(`  ${count} responses: ${totalGas} total gas, ${avgGas} avg per response`);
            }

            gasData.comparisons.batchResponses = results;
        });
    });

    describe("💰 Cost Projections", () => {
        it("should calculate estimated costs at different gas prices", async () => {
            const gasPrices = [
                { name: "Low (10 Gwei)", gwei: 10 },
                { name: "Medium (50 Gwei)", gwei: 50 },
                { name: "High (100 Gwei)", gwei: 100 },
                { name: "Very High (200 Gwei)", gwei: 200 }
            ];

            const ethPriceUSD = 2000; // Approximate ETH price
            const costTable = [];

            console.log("\n  Cost Estimates (assuming ETH = $2000):");
            console.log("  ─────────────────────────────────────────────────\n");

            for (const price of gasPrices) {
                const costs = {};

                for (const [funcName, data] of Object.entries(gasData.functions)) {
                    const gasCost = data.average;
                    const ethCost = (gasCost * price.gwei) / 1e9;
                    const usdCost = ethCost * ethPriceUSD;
                    costs[funcName] = {
                        gas: gasCost,
                        eth: ethCost.toFixed(6),
                        usd: usdCost.toFixed(4)
                    };
                }

                console.log(`  ${price.name}:`);
                for (const [funcName, cost] of Object.entries(costs)) {
                    console.log(`    ${funcName}: $${cost.usd} (${cost.eth} ETH)`);
                }
                console.log();

                costTable.push({ gasPrice: price.name, costs });
            }

            gasData.costProjections = costTable;
        });

        it("should calculate costs for typical usage scenarios", async () => {
            console.log("\n  Typical Usage Scenario Costs:");
            console.log("  ─────────────────────────────────────────────────\n");

            const scenarios = [
                {
                    name: "Single Exam (1 paper, 30 students)",
                    operations: {
                        storePaper: 1,
                        storeStudentResponse: 30
                    }
                },
                {
                    name: "Monthly Usage (10 exams, 50 students each)",
                    operations: {
                        storePaper: 10,
                        storeStudentResponse: 500,
                        addStudentScore: 500
                    }
                },
                {
                    name: "Academic Year (100 exams, 100 students each)",
                    operations: {
                        storePaper: 100,
                        storeStudentResponse: 10000,
                        addStudentScore: 10000,
                        storeQuizScore: 10000
                    }
                }
            ];

            const mediumGasPrice = 50; // Gwei
            const ethPriceUSD = 2000;

            for (const scenario of scenarios) {
                let totalGas = 0;

                for (const [operation, count] of Object.entries(scenario.operations)) {
                    const gasPerOp = gasData.functions[operation]?.average || 0;
                    totalGas += gasPerOp * count;
                }

                const ethCost = (totalGas * mediumGasPrice) / 1e9;
                const usdCost = ethCost * ethPriceUSD;

                console.log(`  ${scenario.name}:`);
                console.log(`    Total Gas: ${totalGas.toLocaleString()}`);
                console.log(`    Cost: $${usdCost.toFixed(2)} (${ethCost.toFixed(6)} ETH)`);
                console.log();
            }
        });
    });

    describe("💡 Optimization Recommendations", () => {
        it("should generate optimization suggestions", async () => {
            console.log("\n  Optimization Analysis:");
            console.log("  ─────────────────────────────────────────────────\n");

            // Analyze string storage
            if (gasData.comparisons.cidLength) {
                const cidData = gasData.comparisons.cidLength;
                const gasIncrease = ((cidData[2].gas - cidData[0].gas) / cidData[0].gas) * 100;

                if (gasIncrease > 20) {
                    const rec = "Consider using shorter CID representations or off-chain storage for metadata";
                    gasData.recommendations.push(rec);
                    console.log(`  ⚠️  CID length impact: +${gasIncrease.toFixed(1)}% gas for longer CIDs`);
                    console.log(`     ${rec}\n`);
                }
            }

            // Analyze array operations
            if (gasData.functions.addStudentScore) {
                const avgGas = gasData.functions.addStudentScore.average;
                if (avgGas > 100000) {
                    const rec = "addStudentScore uses array push which gets expensive with many entries - consider alternative data structures";
                    gasData.recommendations.push(rec);
                    console.log(`  ⚠️  Array operations: ${avgGas} gas per student score`);
                    console.log(`     ${rec}\n`);
                }
            }

            // Compare read vs write operations
            console.log("  💡 General Recommendations:");
            gasData.recommendations.push("Use events instead of storage where possible for historical data");
            gasData.recommendations.push("Implement pagination for array retrievals to prevent out-of-gas errors");
            gasData.recommendations.push("Consider using bytes32 for IDs instead of strings to save gas");
            gasData.recommendations.push("Batch operations when possible to amortize transaction costs");
            gasData.recommendations.push("Use calldata instead of memory for function parameters when applicable");

            gasData.recommendations.forEach((rec, i) => {
                console.log(`     ${i + 1}. ${rec}`);
            });
            console.log();
        });
    });

    after(async () => {
        console.log("\n\n═══════════════════════════════════════════");
        console.log("⛽ GAS OPTIMIZATION REPORT SUMMARY");
        console.log("═══════════════════════════════════════════\n");

        // Function summary
        console.log("📊 FUNCTION GAS COSTS (average):\n");
        for (const [funcName, data] of Object.entries(gasData.functions)) {
            console.log(`  ${funcName.padEnd(25)} ${data.average.toLocaleString().padStart(8)} gas`);
            console.log(`    Range: ${data.min.toLocaleString()} - ${data.max.toLocaleString()}`);
        }

        console.log("\n💰 COST ESTIMATES (at 50 Gwei, ETH=$2000):\n");
        for (const [funcName, data] of Object.entries(gasData.functions)) {
            const ethCost = (data.average * 50) / 1e9;
            const usdCost = ethCost * 2000;
            console.log(`  ${funcName.padEnd(25)} $${usdCost.toFixed(4)}`);
        }

        console.log("\n💡 TOP RECOMMENDATIONS:\n");
        gasData.recommendations.slice(0, 5).forEach((rec, i) => {
            console.log(`  ${i + 1}. ${rec}`);
        });

        // Generate markdown report
        const reportPath = path.join(__dirname, "../test-results");
        if (!fs.existsSync(reportPath)) {
            fs.mkdirSync(reportPath, { recursive: true });
        }

        // Save JSON
        fs.writeFileSync(
            path.join(reportPath, "gas-optimization.json"),
            JSON.stringify(gasData, null, 2)
        );

        // Generate Markdown report
        let markdown = "# Gas Optimization Report\n\n";
        markdown += `Generated: ${new Date().toISOString()}\n\n`;
        markdown += "## Function Gas Costs\n\n";

        const funcTable = [
            ["Function", "Average Gas", "Min Gas", "Max Gas"],
            ...Object.entries(gasData.functions).map(([name, data]) => [
                name,
                data.average.toLocaleString(),
                data.min.toLocaleString(),
                data.max.toLocaleString()
            ])
        ];
        markdown += createMarkdownTable(funcTable[0], funcTable.slice(1));

        markdown += "\n## Cost Estimates\n\n";
        markdown += "Assuming ETH = $2000\n\n";

        const costTable = [
            ["Function", "10 Gwei", "50 Gwei", "100 Gwei"],
            ...Object.entries(gasData.functions).map(([name, data]) => {
                const calc = (gwei) => {
                    const eth = (data.average * gwei) / 1e9;
                    return `$${(eth * 2000).toFixed(4)}`;
                };
                return [name, calc(10), calc(50), calc(100)];
            })
        ];
        markdown += createMarkdownTable(costTable[0], costTable.slice(1));

        markdown += "\n## Optimization Recommendations\n\n";
        gasData.recommendations.forEach((rec, i) => {
            markdown += `${i + 1}. ${rec}\n`;
        });

        fs.writeFileSync(
            path.join(reportPath, "GAS-OPTIMIZATION.md"),
            markdown
        );

        console.log("\n✅ Results saved to test-results/");
        console.log("   - gas-optimization.json");
        console.log("   - GAS-OPTIMIZATION.md");
        console.log("\n═══════════════════════════════════════════\n");
    });
});
