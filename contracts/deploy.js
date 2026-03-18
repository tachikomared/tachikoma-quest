const { ethers } = require("hardhat");

// $TACHI token on Base
const TACHI_TOKEN = "0x39B4B879b8521d6A8C3a87cda64b969327b7fbA3";

async function main() {
  console.log("Deploying CommunityBurner...");
  
  const CommunityBurner = await ethers.getContractFactory("CommunityBurner");
  const burner = await CommunityBurner.deploy(TACHI_TOKEN);
  
  await burner.waitForDeployment();
  
  const address = await burner.getAddress();
  console.log(`CommunityBurner deployed to: ${address}`);
  console.log(`TACHI Token: ${TACHI_TOKEN}`);
  
  // Wait for block confirmations
  console.log("Waiting for block confirmations...");
  await burner.deploymentTransaction().wait(5);
  
  // Verify on Basescan (if API key set)
  console.log("Run this to verify:");
  console.log(`npx hardhat verify --network base ${address} ${TACHI_TOKEN}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
