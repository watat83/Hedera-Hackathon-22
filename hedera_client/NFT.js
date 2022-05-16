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

let CIDs = [];
let NFTs = [];

const data = require(process.cwd() + "/hedera_client/data.json", 'utf-8');
const bytecode = require(process.cwd() + "/build/contracts/JobPost.json", 'utf8').bytecode;
let bytecodeFileId;
const fileUpload = require(process.cwd() + "/hedera_client/FileUpload.js", 'utf-8');


const {
  create,
  CID,
  urlSource
} = require('ipfs-http-client');

const {
  INFURA_IPFS_PROJECT_ID,
  INFURA_IPFS_PROJECT_SECRET
} = process.env;

const auth =
  'Basic ' + btoa(INFURA_IPFS_PROJECT_ID + ':' + INFURA_IPFS_PROJECT_SECRET)

const ipfs_remote = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: auth
  }
});
const ipfs_local = create({
  host: 'localhost',
  port: 5001,
  protocol: 'http',
  headers: {
    authorization: 'Bearer ' + auth
  }
})


const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
const operatorKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY);

const thomasId = AccountId.fromString(process.env.HEDERA_THOMAS_ACCOUNT_ID);
const thomasKey = PrivateKey.fromString(process.env.HEDERA_THOMAS_PRIVATE_KEY);

const jerryId = AccountId.fromString(process.env.HEDERA_JERRY_ACCOUNT_ID);
const jerryKey = PrivateKey.fromString(process.env.HEDERA_JERRY_PRIVATE_KEY);

const client = Client.forTestnet().setOperator(operatorId, operatorKey);

const supplyKey = PrivateKey.generate();
const adminKey = PrivateKey.generate();
let nftCustomFee;
let tokenId;

async function createContractBytecodeFileId() {
  const fileCreateTx = await new FileCreateTransaction()
    .setKeys([operatorKey])
    .freezeWith(client);
  const fileCreateSign = await fileCreateTx.sign(operatorKey);
  const fileCreateSubmit = await fileCreateSign.execute(client);
  const fileCreateRx = await fileCreateSubmit.getReceipt(client);
  bytecodeFileId = fileCreateRx.fileId;
  console.log(`- The smart contract bytecode file ID is ${bytecodeFileId}`);
  console.log('👉 ' + ' https://testnet.dragonglass.me/hedera/contracts/' + bytecodeFileId);
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
  const contractId = contractInstantiateRx.contractId;
  const contractAddress = contractId.toSolidityAddress();
  console.log(`- The smart contract ID is: ${contractId}`);
  console.log(
    `- The smart contract ID in Solidity format is: ${contractAddress} \n`
  );
  console.log('👉 ' + ' https://testnet.dragonglass.me/hedera/contracts/' + contractId);

}


async function createCIDs() {
  for (let i = 0; i < data.length; i++) {
    CIDs.push(await fileUpload.addMetadataToIPFS(data[i]))
  }
  console.log("\n")
  console.log("LIST OF CIDs USED TO GENERATE NFTs FROM ======================== \n")
  console.log(CIDs)
}

async function customFeeSchedule() {
  nftCustomFee = await new CustomRoyaltyFee()
    .setNumerator(5)
    .setDenominator(10)
    .setFeeCollectorAccountId(operatorId)
    .setFallbackFee(new CustomFixedFee().setHbarAmount(new Hbar(200)))
}

async function createNFTCollectionWithCustomFee() {
  let nftCreate = await new TokenCreateTransaction()
    .setTokenName("Hack Hedera 22")
    .setTokenSymbol("HH22")
    .setTokenType(TokenType.NonFungibleUnique)
    .setDecimals(0)
    .setInitialSupply(0)
    .setTreasuryAccountId(operatorId)
    .setSupplyType(TokenSupplyType.Infinite)
    .setCustomFees([nftCustomFee])
    .setAdminKey(adminKey)
    .setSupplyKey(supplyKey)
    .freezeWith(client)
    .sign(operatorKey)

  let nftCreateSign = await nftCreate.sign(adminKey);
  let nftCreateSubmit = await nftCreateSign.execute(client);
  let nftCreateRx = await nftCreateSubmit.getReceipt(client);
  tokenId = nftCreateRx.tokenId;
  console.log(`Created NFT With Token ID: ${tokenId} \n`)
  console.log(`Created NFT With Token Contract Solidity format: ${tokenId.toSolidityAddress()} \n`)
}

async function checkTokenInfo(_tokenId) { // RoyaltiesInfo, TotalSupply, and More
  const tokenInfo = await new TokenInfoQuery().setTokenId(_tokenId).execute(client);
  console.table(tokenInfo.customFees[0]);
  return tokenInfo;
}

async function tokenMinterFnc(CID) {
  mintTx = await new TokenMintTransaction()
    .setTokenId(tokenId)
    .setMetadata([Buffer.from(CID)])
    .freezeWith(client);

  let mintTxSign = await mintTx.sign(supplyKey);
  let mintTxSubmit = await mintTxSign.execute(client);
  let mintRx = await mintTxSubmit.getReceipt(client);
  return mintRx;
}

async function mintNFTsInBatch() {
  console.log("\nMinting New NFT Accounts for NFT Class " + tokenId + " ================== \n")
  for (let i = 0; i < CIDs.length; i++) {
    NFTs[i] = await tokenMinterFnc(CIDs[i]);
    console.log(`Minted New Account as NFT with serial: ${NFTs[i].serials[0].low}`)

  }
}

async function burnNFTFromCollection() {
  let tokenBurnTx = await new TokenBurnTransaction()
    .setTokenId(tokenId)
    .setSerials([CIDs.length])
    .freezeWith(client)
    .sign(supplyKey);

  let tokenBurnSubmit = await tokenBurnTx.execute(client);
  let tokenBurnRx = await tokenBurnSubmit.getReceipt(client);
  console.log(`\nBurnt NFT with Serial: ${CIDs.length}: ${tokenBurnRx.status} \n`);

  let tokenInfo = await checkTokenInfo(tokenId);
  console.log(`\nCurrent NFT Supply is: ${tokenInfo.totalSupply} \n`);
}

async function autoAssociateAccountToNFT(_accountId, _accountKey) {
  let associateTx = await new AccountUpdateTransaction()
    .setAccountId(_accountId)
    .setMaxAutomaticTokenAssociations(100) // Up to 1000
    .freezeWith(client)
    .sign(_accountKey);

  let associateTxSubmit = await associateTx.execute(client);
  let associateRx = await associateTxSubmit.getReceipt(client);
  console.log(`\n${_accountId} NFT Auto-association: ${associateRx.status} \n`);
}

async function manualAssociateAccountToNFT(_accountId, _accountKey) {
  let associateTx = await new TokenAssociateTransaction()
    .setAccountId(_accountId)
    .setMaxAutomaticTokenAssociations(100) // Up to 1000
    .freezeWith(client)
    .sign(_accountKey);

  let associateTxSubmit = await associateTx.execute(client);
  let associateRx = await associateTxSubmit.getReceipt(client);
  console.log(`\nAccount ${_accountId} NFT Auto-association status: ${associateRx.status} \n`);
}

async function checkAccountBalance(_accountId) {
  balanceCheckTx = await new AccountBalanceQuery()
    .setAccountId(_accountId)
    .execute(client);
  console.log(`\nUser "${operatorId}" Balance: ${balanceCheckTx.tokens._map.get(tokenId.toString())} NFTs and ${balanceCheckTx.hbars}bars \n`);
  return [balanceCheckTx.tokens._map.get(tokenId.toString()), balanceCheckTx.hbars];
}

async function transferNFT(_fromAccountId, _fromAccountKey, _toAccountId, _nftSerial) {
  let tokenTransferTx = await new TransferTransaction()
    .addNftTransfer(tokenId, _nftSerial, _fromAccountId, _toAccountId)
    .freezeWith(client)
    .sign(_fromAccountKey);

  let tokenTransferSubmit = await tokenTransferTx.execute(client);
  let tokenTransferRx = await tokenTransferSubmit.getReceipt(client);
  console.log(`\nNFT Transfer ${_fromAccountId} -> ${_toAccountId} status: ${tokenTransferRx.status} \n`);
}

async function buyNFT(_sellerAccountId, _sellerAccountKey, _buyerAccountId, _buyerAccountKey, _nftSerial, _amount) {
  let tokenTransferTx = await new TransferTransaction()
    .addNftTransfer(tokenId, _nftSerial, _sellerAccountId, _buyerAccountId)
    .addHbarTransfer(_sellerAccountId, _amount)
    .addHbarTransfer(_buyerAccountId, -_amount)
    .freezeWith(client)
    .sign(_sellerAccountKey);

  let tokenTransferSign = await tokenTransferTx.sign(_buyerAccountKey);
  let tokenTransferSubmit = await tokenTransferSign.execute(client);
  let tokenTransferRx = await tokenTransferSubmit.getReceipt(client);
  console.log(`\nAccount ${_sellerAccountId} -> ${_buyerAccountId} status: ${tokenTransferRx.status} \n`);
}



async function main() {
  await createContractBytecodeFileId();
  await uploadBytecode();
  await instantiateContract();
  await createCIDs();
  await customFeeSchedule();
  await createNFTCollectionWithCustomFee();
  await checkTokenInfo(tokenId);
  await mintNFTsInBatch();
  await burnNFTFromCollection();
  await autoAssociateAccountToNFT(operatorId, operatorKey);
  await autoAssociateAccountToNFT(thomasId, thomasKey);
  // await manualAssociateAccountToNFT(thomasId, thomasKey);
  await checkAccountBalance(operatorId);
  await transferNFT(operatorId, operatorKey, thomasId, 1);
  await checkAccountBalance(operatorId);
  await buyNFT(operatorId, operatorKey, thomasId, thomasKey, 2, 100);
  await checkAccountBalance(operatorId);
}


main();