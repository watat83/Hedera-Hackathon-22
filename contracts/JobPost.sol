// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

pragma experimental ABIEncoderV2;

contract JobPost {
  struct Job{
    uint256 jobId;
    string jobTitle;
    string paymentMethod;
    address account;
  }

  enum paymentMethods{ CASH, DEBIT, CREDIT, CRYPTO }

  // mapping(uint => Job) JobsByIndex;
  mapping(address => Job[]) JobsByAccount;
  uint256 public jobCounter = 0;

  constructor() {
  }

  // function newJobPost(string memory _jobTitle, string memory _paymentMethod, address _account) public{
  //   jobCounter++;
  //   JobsByIndex[jobCounter] = Job(jobCounter, _jobTitle, _paymentMethod, _account);
  // }
  function newJobPostByAccount(string memory _jobTitle, string memory _paymentMethod) public{
    jobCounter++;
    JobsByAccount[msg.sender].push(Job(jobCounter, _jobTitle, _paymentMethod, msg.sender));
  }

  // function getOneJobPost(uint256 _jobId) public view returns (uint256 jobId,string memory jobTitle,string memory paymentMethod,address account){
  //   require(_jobId <= jobCounter);
  //   return (JobsByIndex[_jobId].jobId, JobsByIndex[_jobId].jobTitle, JobsByIndex[_jobId].paymentMethod, JobsByIndex[_jobId].account);
  // }

  function getOneJobPostByAccount2(address _account, uint256 _jobId) public view returns (address account, uint256 jobId,string memory jobTitle,string memory paymentMethod){
    // require(_account <= jobCounter);
    Job[] storage jobs = JobsByAccount[_account];
    for (uint index = 0; index < jobs.length; index++) {
      if (jobs[index].jobId == _jobId) {
        return (jobs[index].account, jobs[index].jobId, jobs[index].jobTitle, jobs[index].paymentMethod);
      }
    }
    // return (0,"","",0x0);
  }
  function getOneJobPostByAccount(address _account, uint256 _jobId) public view returns (Job memory job){
    // require(_account <= jobCounter);
    Job[] storage jobs = JobsByAccount[_account];
    for (uint index = 0; index < jobs.length; index++) {
      if (jobs[index].jobId == _jobId) {
        return (jobs[index]);
      }
    }
    // return (0,"","",0x0);
  }

  // function updateJobPost(uint256 _jobId, string memory _jobTitle, string memory _paymentMethod, address _account) public{
  //   require(_jobId <= jobCounter);
  //   require(JobsByIndex[_jobId].account == msg.sender, "Not original author");
  //   JobsByIndex[_jobId].jobTitle = _jobTitle;
  //   JobsByIndex[_jobId].paymentMethod = _paymentMethod;
  //   JobsByIndex[_jobId].account = _account;
  // }

  function updateJobPostByAccount(uint256 _jobId, string memory _jobTitle, string memory _paymentMethod, address _account) public{
    Job[] storage jobs = JobsByAccount[_account];
    require(_jobId <= jobCounter);
    // require(jobs, "This user does not exist");
    require(jobs.length > 0, "No Job post exists for this user");
    for (uint i = 0; i < jobs.length; i++) {
      if (jobs[i].jobId == _jobId) {
        jobs[i].jobTitle = _jobTitle;
        jobs[i].paymentMethod = _paymentMethod;
        jobs[i].account = _account;
      }
    }
  }

  function getAllJobsByAccount() public view returns (Job[] memory){
    Job[] storage jobs = JobsByAccount[msg.sender];
    require(jobs.length > 0, "No Job post exists for this user");
    return jobs;
  }
}
