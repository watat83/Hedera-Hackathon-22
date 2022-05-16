console.clear();


require("dotenv").config();

const {
  Client,
  AccountId,
  PrivateKey,
  Hbar,
  TokenCreateTransaction,
  FileCreateTransaction,
  FileAppendTransaction,
  ContractCallQuery,
  ContractCreateTransaction,
  ContractFunctionParameters,
  TokenUpdateTransaction,
  TransferTransaction,
  ContractExecuteTransaction,
  TokenInfoQuery,
  TokenMintTransaction,
  TokenBurnTransaction,
  TokenType,
  TokenSupplyType,
  CustomRoyaltyFee,
  CustomFixedFee,
  AccountBalanceQuery,
  AccountUpdateTransaction,
  TokenAssociateTransaction,
} = require("@hashgraph/sdk");
const fs = require("fs");

const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
const operatorKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY);

const thomasId = AccountId.fromString(process.env.HEDERA_THOMAS_ACCOUNT_ID);
const thomasKey = PrivateKey.fromString(process.env.HEDERA_THOMAS_PRIVATE_KEY);

const jerryId = AccountId.fromString(process.env.HEDERA_JERRY_ACCOUNT_ID);
const jerryKey = PrivateKey.fromString(process.env.HEDERA_JERRY_PRIVATE_KEY);

const data = require(process.cwd() + "/hedera_client/data.json", 'utf-8');
const bytecode = require(process.cwd() + "/build/contracts/JobPost.json", 'utf8').bytecode;
let bytecodeFileId;
const fileUpload = require(process.cwd() + "/hedera_client/FileUpload.js", 'utf-8');


// const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
// const operatorKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY);

const client = Client.forTestnet().setOperator(operatorId, operatorKey);

const supplyKey = PrivateKey.generate();
const adminKey = PrivateKey.generate();
let nftCustomFee;
let tokenId;
let contractId;

async function createContractBytecodeFileId() {
  const fileCreateTx = await new FileCreateTransaction()
    .setKeys([operatorKey])
    .freezeWith(client);
  const fileCreateSign = await fileCreateTx.sign(operatorKey);
  const fileCreateSubmit = await fileCreateSign.execute(client);
  const fileCreateRx = await fileCreateSubmit.getReceipt(client);
  bytecodeFileId = fileCreateRx.fileId;
  console.log(`\nGENERATING CONTRACT BYTECODE ID =============== \n`)
  console.log(`- The smart contract bytecode file ID is ${bytecodeFileId} \n`);
  console.log('👉 ' + ' https://testnet.dragonglass.me/hedera/contracts/' + bytecodeFileId + '\n');
}
async function uploadBytecode() {
  const fileAppendTx = await new FileAppendTransaction()
    .setFileId(bytecodeFileId)
    .setContents(bytecode)
    .setMaxChunks(10)
    .freezeWith(client);
  const fileAppendSign = await fileAppendTx.sign(operatorKey);
  const fileAppendSubmit = await fileAppendSign.execute(client);
  const fileAppendRx = await fileAppendSubmit.getReceipt(client);
  console.log(`\nUPLOADING CONTRACT BYTECODE TO NETWORK ======= \n`)
  console.log(`- Content added: ${fileAppendRx.status} \n`);
}

async function instantiateContract() {
  const contractInstantiateTx = new ContractCreateTransaction()
    .setBytecodeFileId(bytecodeFileId)
    .setGas(3000000)
  // .setConstructorParameters(
  //   new ContractFunctionParameters()
  // );
  const contractInstantiateSubmit = await contractInstantiateTx.execute(client);
  const contractInstantiateRx = await contractInstantiateSubmit.getReceipt(
    client
  );
  contractId = contractInstantiateRx.contractId;
  const contractAddress = contractId.toSolidityAddress();
  console.log(`\nINSTANTIATE THE CONTRACT ON HEDERA ======= \n`)
  console.log(`- The smart contract ID is: ${contractId}`);
  console.log(
    `- The smart contract ID in Solidity format is: ${contractAddress} \n`
  );
  console.log('👉 ' + ' https://testnet.dragonglass.me/hedera/contracts/' + contractId);

}

async function newJobPostByAccount(_title, _paymentMethod) {
  const contractExecTx = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(3000000)
    .setFunction(
      "newJobPostByAccount",
      new ContractFunctionParameters().addString(_title).addString(_paymentMethod)
    );
  const contractExecSubmit = await contractExecTx.execute(client);
  const contractExecRx = await contractExecSubmit.getReceipt(client);
  console.log(`\nCREATING A NEW JOB POST ======= \n`)
  console.log(`- New Job Post Created: ${contractExecRx.status.toString()}`);


}

async function getOneJobPostByAccount2(_accountId, _jobId) {
  const contractQuery = await new ContractCallQuery()
    //Set the gas for the query
    .setGas(100000)
    //Set the contract ID to return the request for
    .setContractId(contractId)
    //Set the contract function to call
    .setFunction("getOneJobPostByAccount2", new ContractFunctionParameters().addAddress(_accountId.toSolidityAddress()).addUint256(_jobId))
    //Set the query payment for the node returning the request
    //This value must cover the cost of the request otherwise will fail
    .setQueryPayment(new Hbar(2));

  //Submit to a Hedera network
  const getOneJobPostByAccount2 = await contractQuery.execute(client);
  console.log(`\nRETRIEVE A JOB POST BY ACCOUNT ======= \n`)
  console.log(`- New Job Post Account Owner: ${await getOneJobPostByAccount2.getAddress()}`)
  // console.log(`- New Job Post Created2: ${await getOneJobPostByAccount2.getString(1)}`)
  console.log(`- New Job Post Title: ${await getOneJobPostByAccount2.getString(2)}`)
  console.log(`- New Job Post Payment Method: ${await getOneJobPostByAccount2.getString(3)}`)
}

async function main() {
  await createContractBytecodeFileId()
  await uploadBytecode()
  await instantiateContract()
  await newJobPostByAccount("The Book Of Ethereum", "CASH");
  await newJobPostByAccount("The Second Book Of Ethereum", "DEBIT");
  await getOneJobPostByAccount2(operatorId, 2);
}

main();