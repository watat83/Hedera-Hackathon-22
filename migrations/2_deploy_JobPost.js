const JobPost = artifacts.require("JobPost");

module.exports = async (deployer, networks, accounts) => {
  await deployer.deploy(JobPost);
}