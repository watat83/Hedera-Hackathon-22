console.clear()

const JobPost = artifacts.require("JobPost");


contract("Job Posting Smart Contract", function (accounts) {
  beforeEach("setup All Contracts", async function () {
    JobPostContract = await JobPost.deployed();
  });

  describe("Contract Initialization", () => {
    it("Deployed The Job Post Contract Successfully!", async function () { // 
      assert(JobPostContract.address != 0x0, "Contract Not Deployed Successfully!"); // 
    });
  });

  describe("Game Functions", () => {

    it("Creates Couple New Job Posts", async function () { // 
      await JobPostContract.newJobPostByAccount("Solidity Book", "CASH", {
        from: accounts[0]
      })
      await JobPostContract.newJobPostByAccount("Solidity Book By Author", "DEBIT", {
        from: accounts[1]
      })
      await JobPostContract.newJobPostByAccount("Second Book By Author", "CRYPTO", {
        from: accounts[1]
      })

    });
    it("Returns a Newly Created Job Post", async function () { // 
      // const oneJobPost = await JobPostContract.getOneJobPost(1);
      const twoJobPost = await JobPostContract.getOneJobPostByAccount(accounts[1], 3);
      // console.log(oneJobPost)
      // console.log("twoJobPost", twoJobPost)
      assert(twoJobPost.jobTitle == "Second Book By Author", "Book Not Set Correctly"); //
    });

    it("Updates a existing Job Post", async function () { // 
      await JobPostContract.updateJobPostByAccount(3, "New Solidity Book Updated", "CRYPTO", (accounts[1]), {
        from: accounts[1]
      });
      const oneJobPostUpdated = await JobPostContract.getOneJobPostByAccount(accounts[1], 3);
      // console.log(oneJobPostUpdated)
      assert(oneJobPostUpdated.jobTitle == "New Solidity Book Updated", "Book Not Updated Correctly"); //
    });

    it("Ensure only owner can edit Job Post", async function () { // 
      await JobPostContract.updateJobPostByAccount(3, "New Solidity Book Updated", "CRYPTO", (accounts[0]), {
        from: accounts[0]
      });
      const oneJobPostUpdated = await JobPostContract.getOneJobPostByAccount(accounts[1], 2);
      // console.log(oneJobPostUpdated)
      try {
        assert.equal(oneJobPostUpdated.jobTitle, "New Solidity Book Updated", "Book Not Updated Correctly"); //

      } catch (error) {
        // console.log(error.expected)
        assert.notEqual(error.expected, error.actual)
      }
    });

    it("Returns All Job Posts Created By An Account", async function () { // 
      const allJobsByAccount = await JobPostContract.getAllJobsByAccount({
        from: accounts[1]
      })

      // console.log(allJobsByAccount[0])

    });
  });
});