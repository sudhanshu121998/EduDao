const hre = require("hardhat")

const tokens = (n) => {
  return hre.ethers.parseUnits(n.toString(), 'ether')
}

async function main() {
  const [deployer] = await hre.ethers.getSigners()

  const Paper = await hre.ethers.getContractFactory("TimeLockQuestionPaper")
  const paper = await Paper.deploy()
  await paper.waitForDeployment()  // <- changed here

  console.log(`✅ Deployed TimeLockQuestionPaper Contract at: ${paper.target}`) // Ethers v6 uses `target` instead of `address`
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})