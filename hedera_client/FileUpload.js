const fs = require('fs');
const {
  create,
  CID,
  urlSource
} = require('ipfs-http-client');
const https = require("https");


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

module.exports = {

  addMetadataToIPFS: async (body) => {
    console.log("\n")
    console.log("ADDING METADATA TO LOCAL IPFS ========================] \n")
    const metaData = {
      name: body.name,
      description: body.description,
      image: body.profile,
      properties: {
        dob: body.dob,
        email: body.email,
      }
    }
    const medaAdded = await ipfs_local.add(JSON.stringify(metaData));
    const cid = await medaAdded.cid.toString()
    console.log("📁  " + "http://localhost:8080/ipfs/" + cid)
    return (cid)
  }
}