import { exec } from "child_process";
import { promisify } from "util";

const execPromisify = promisify(exec);

const channelName = process.env.CHANNEL_NAME;
const chaincodeName = process.env.CHAINCODE_NAME;
const peer0Org1Address = process.env.PEER0_ORG1_CORE_ADDRESS;
const peer0Org2Address = process.env.PEER0_ORG2_CORE_ADDRESS;
const peer0Org1Domain = process.env.PEER0_ORG1_DOMAIN;
const peer0Org2Domain = process.env.PEER0_ORG2_DOMAIN;
const org1Domain = process.env.ORG1_DOMAIN;
const org2Domain = process.env.ORG2_DOMAIN;
const orderer1Address = process.env.ORDERER1_ORG1_ADDRESS;
const orderer2Address = process.env.ORDERER2_ORG1_ADDRESS;
const smartContract = process.env.SMART_CONTRACT_NAME;

// Modify generateInvokeCommand based on host location
const generateInvokeCommand = (method, parsedData) => {
  const invokeCommand = `docker exec cli peer chaincode invoke -o ${orderer1Address} --tls true 
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem -C ${channelName} -n ${chaincodeName} 
    --peerAddresses ${peer0Org1Address} --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/${org1Domain}/peers/${peer0Org1Domain}/tls/ca.crt 
    --peerAddresses ${peer0Org2Address} --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/${org2Domain}/peers/${peer0Org2Domain}/tls/ca.crt 
    -c '{\"Args\": [\"${smartContract}:${method}\", \"${parsedData}\"]}'`;
  return invokeCommand;
};

export async function addTransaction(data) {
  const parsedData = data.replace(/"/g, '\\"');
  const command = generateInvokeCommand("put", parsedData);
  const { _, stderr } = await execPromisify(command);
  if (stderr.includes("Chaincode invoke successful")) {
    // Extract the payload
    const resultMatch = stderr.match(/payload:"(.*)"/);
    // Parse the payload JSON
    const resultJson = JSON.parse(resultMatch[1].replace(/\\"/g, '"'));
    return { status: 201, data: resultJson, error: "" };
  } else {
    return { status: 400, data: {}, error: stderr };
  }
}

export async function queryAllTransactions() {
  const command = `docker exec cli peer chaincode query -n ${chaincodeName} -C ${channelName} -c '{"Args": ["${smartContract}:queryAllOrders", ""]}'`;
  return await execPromisify(command);
}

export async function queryTransaction(hash) {
  const command = `docker exec cli peer chaincode query -n ${chaincodeName} -C ${channelName} -c '{"Args": ["${smartContract}:get", \"${hash}\"]}'`;
  return await execPromisify(command);
}
