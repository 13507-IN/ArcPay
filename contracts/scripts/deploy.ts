import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("=================================================");
  console.log("  ArcPay: Deploying ArcMilestoneEscrow on Arc   ");
  console.log("=================================================");

  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("Deployer account not configured. Check PRIVATE_KEY in .env");
  }

  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);
  const networkInfo = await ethers.provider.getNetwork();

  console.log(`Deployer Address : ${deployerAddress}`);
  console.log(`Network Name     : ${network.name}`);
  console.log(`Chain ID         : ${networkInfo.chainId.toString()}`);
  console.log(`Native USDC Bal  : ${ethers.formatUnits(balance, 18)} USDC`);

  if (networkInfo.chainId !== 5042002n && network.name === "arcTestnet") {
    console.warn("⚠️ Warning: Expected Chain ID 5042002 for Arc Testnet.");
  }

  console.log("\nDeploying ArcMilestoneEscrow contract...");
  const EscrowFactory = await ethers.getContractFactory("ArcMilestoneEscrow");
  const escrow = await EscrowFactory.deploy();
  await escrow.waitForDeployment();

  const contractAddress = await escrow.getAddress();
  const deploymentTx = escrow.deploymentTransaction();

  console.log("\n================ Deployment Summary ================");
  console.log(`Contract Address : ${contractAddress}`);
  console.log(`Transaction Hash : ${deploymentTx?.hash}`);
  console.log(`Arc Explorer     : https://explorer.testnet.arc.io/address/${contractAddress}`);
  console.log("====================================================");

  // Write deployment info to a shared deployment json
  const deploymentData = {
    network: network.name,
    chainId: Number(networkInfo.chainId),
    contractAddress,
    deployer: deployerAddress,
    deploymentTx: deploymentTx?.hash,
    deployedAt: new Date().toISOString(),
  };

  const contractsOutputDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(contractsOutputDir)) {
    fs.mkdirSync(contractsOutputDir, { recursive: true });
  }

  const deploymentPath = path.join(contractsOutputDir, `${network.name}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
  console.log(`\nSaved deployment record to: ${deploymentPath}`);

  // Automatically update backend and frontend env if present
  console.log("\nTo configure your frontend & backend, set:");
  console.log(`NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`ESCROW_CONTRACT_ADDRESS=${contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
