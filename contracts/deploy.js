const { ethers } = require("hardhat");

// $TACHI token on Base
const TACHI_TOKEN = "0x39B4B879b8521d6A8C3a87cda64b969327b7fbA3";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  
  // 1. Deploy CommunityBurner
  console.log("1. Deploying CommunityBurner...");
  const CommunityBurner = await ethers.getContractFactory("CommunityBurner");
  const burner = await CommunityBurner.deploy(TACHI_TOKEN);
  await burner.waitForDeployment();
  const burnerAddress = await burner.getAddress();
  console.log(`   CommunityBurner deployed to: ${burnerAddress}`);
  
  // 2. Deploy CommunityStakingPool
  console.log("2. Deploying CommunityStakingPool...");
  const CommunityStakingPool = await ethers.getContractFactory("CommunityStakingPool");
  const stakingPool = await CommunityStakingPool.deploy(TACHI_TOKEN);
  await stakingPool.waitForDeployment();
  const stakingPoolAddress = await stakingPool.getAddress();
  console.log(`   CommunityStakingPool deployed to: ${stakingPoolAddress}`);
  
  // 3. Deploy TachiCasino
  console.log("3. Deploying TachiCasino...");
  const TachiCasino = await ethers.getContractFactory("TachiCasino");
  const casino = await TachiCasino.deploy(TACHI_TOKEN);
  await casino.waitForDeployment();
  const casinoAddress = await casino.getAddress();
  console.log(`   TachiCasino deployed to: ${casinoAddress}`);
  
  // Set casino as owner of staking pool (for deposits)
  console.log("4. Configuring contracts...");
  await stakingPool.transferOwnership(casinoAddress);
  console.log(`   Transferred staking pool ownership to casino`);
  
  // Wait for confirmations
  console.log("5. Waiting for block confirmations...");
  await burner.deploymentTransaction().wait(2);
  await stakingPool.deploymentTransaction().wait(2);
  await casino.deploymentTransaction().wait(2);
  
  console.log("\n=== DEPLOYMENT COMPLETE ===");
  console.log(`CommunityBurner:   ${burnerAddress}`);
  console.log(`CommunityStakingPool: ${stakingPoolAddress} (owned by casino)`);
  console.log(`TachiCasino:      ${casinoAddress}`);
  console.log(`TACHI Token:      ${TACHI_TOKEN}`);
  
  console.log("\n=== VERIFICATION COMMANDS ===");
  console.log(`npx hardhat verify --network base ${burnerAddress} ${TACHI_TOKEN}`);
  console.log(`npx hardhat verify --network base ${stakingPoolAddress} ${TACHI_TOKEN}`);
  console.log(`npx hardhat verify --network base ${casinoAddress} ${TACHI_TOKEN}`);
  
  // Save to file for frontend
  const fs = require('fs');
  const addresses = {
    communityBurner: burnerAddress,
    communityStakingPool: stakingPoolAddress,
    tachiCasino: casinoAddress,
    tachiToken: TACHI_TOKEN,
    network: "base",
    deployedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(
    './deployed-addresses.json',
    JSON.stringify(addresses, null, 2)
  );
  console.log("\nAddresses saved to: deployed-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
