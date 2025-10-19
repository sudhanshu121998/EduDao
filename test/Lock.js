const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TimeLockQuestionPaper", function () {
  
  let paper
  let deployer, buyer

  beforeEach(async () => {
    // Setup accounts
    [deployer, buyer] = await ethers.getSigners()

    // Deploy contract
    const Paper = await ethers.getContractFactory("TimeLockQuestionPaper")
    paper = await Paper.deploy()
  })
  describe("Deployment", () => {
    it("Sets the owner", async () => {
      expect(await paper.owner()).to.equal(deployer.address)
    })

    describe("storePaper",()=>{

      beforeEach(async () => {
        // Setup accounts
        // const id = ethers.utils.formatBytes32String("1");
        const unlockTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
        setPaper = await paper.connect(deployer).storePaper("maths_midsem_90", "somecid", unlockTime);
    
      await setPaper.wait();
       
      })

      it("set Paper", async ()=>{
        const questionPaper=await paper.papers("maths_midsem_90");
        expect(questionPaper.cid).to.equal("somecid")
      })

    



    })

    
  })

  // describe("isPaperExist", () => {
  //   it("returns false for a paper that does not exist", async () => {
  //     const exists = await paper.isPaperExist("non_existing_paper");
  //     expect(exists).to.equal(false);
  //   });
  
  //   it("returns true for a paper that exists", async () => {
  //     const unlockTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  //     await paper.connect(deployer).storePaper("maths_midsem_91", "somecid", unlockTime);
  
  //     const exists = await paper.isPaperExist("maths_midsem_91");
  //     expect(exists).to.equal(false);
  //   });
  // });
//    describe("getPaper", () => {
//   let unlockTime;
//   const paperId = "maths_midsem_90";
//   const paperCID = "somecid";

//   beforeEach(async () => {
//     unlockTime = Math.floor(Date.now() / 1000) + 2; // +2 sec for faster testing
//     const tx = await paper.connect(deployer).storePaper(paperId, paperCID, unlockTime);
//     await tx.wait();

//     // Wait for unlockTime to pass
//     // await ethers.provider.send("evm_increaseTime", [3]);
//     // await ethers.provider.send("evm_mine");
//   });

//   it("gets the paper CID after unlock time", async () => {
//     const cid = await paper.getPaperCID(paperId, unlockTime + 3);
//     expect(cid).to.equal(paperCID);
//   });
// });
describe("getPaper", () => {
  let unlockTime;
  const paperId = "maths_midsem_90";
  const paperCID = "somecid";

  beforeEach(async () => {
    // Get the current blockchain timestamp
    const blockNum = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNum);
    const currentTime = block.timestamp;

    unlockTime = currentTime + 3; // unlock after 3 seconds from now

    const tx = await paper.connect(deployer).storePaper(paperId, paperCID, unlockTime);
    await tx.wait();

    // Simulate time passage
    await ethers.provider.send("evm_increaseTime", [4]); // add 4 seconds
    await ethers.provider.send("evm_mine"); // mine a new block with the new timestamp
  });

  it("gets the paper CID after unlock time", async () => {
    const currentChainTime = (await ethers.provider.getBlock("latest")).timestamp;
    expect(currentChainTime).to.be.greaterThan(unlockTime);

    const cid = await paper.getPaperCID(paperId, currentChainTime);
    expect(cid).to.equal(paperCID);
  });
});

    describe("storeStudentResponse", () => {
      beforeEach(async () => {
        setResponse = await paper.connect(deployer).storeStudentResponse("1", "abcd", "1");
        await setResponse.wait();
      });
    
      it("sets student response correctly", async () => {
        const response = await paper.getStudentResponseCID("1", "1");
        expect(response).to.equal("abcd");
      });
    });

    describe("addStudentScore", () => {
      beforeEach(async () => {
        await paper.connect(deployer).addStudentScore("quiz1", "student1", 80);
        await paper.connect(deployer).addStudentScore("quiz1", "student2", 95);
      });
    
      it("stores multiple student scores for a quiz", async () => {
        const scores = await paper.getStudentScores("quiz1");
        expect(scores.length).to.equal(2);
        expect(scores[0].studentId).to.equal("student1");
        expect(scores[0].score).to.equal(80);
        expect(scores[1].studentId).to.equal("student2");
        expect(scores[1].score).to.equal(95);
      });
    });
    describe("storeQuizScore", () => {
      beforeEach(async () => {
        await paper.connect(deployer).storeQuizScore("quiz1", "Quiz One", "student1", 80);
        await paper.connect(deployer).storeQuizScore("quiz2", "Quiz Two", "student1", 95);
      });
    
      it("stores multiple quiz scores for a student", async () => {
        const scores = await paper.getQuizScores("student1");
        expect(scores.length).to.equal(2);
        expect(scores[0].quizId).to.equal("quiz1");
        expect(scores[0].score).to.equal(80);
        expect(scores[1].quizId).to.equal("quiz2");
        expect(scores[1].score).to.equal(95);
      });
    });

    
  })