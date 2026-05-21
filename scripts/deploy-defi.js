const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying DeFi contracts with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "QIE");

  // Existing QIEPay contract address
  const QIEPAY_ADDRESS = "0xFFC670DA0f40c1602175415abd9CEcd6d6BADD42";

  // 1. Deploy QIERewards
  console.log("\n--- Deploying QIERewards ---");
  const QIERewards = await hre.ethers.getContractFactory("QIERewards");
  const rewards = await QIERewards.deploy(QIEPAY_ADDRESS);
  await rewards.waitForDeployment();
  const rewardsAddr = await rewards.getAddress();
  console.log("QIERewards deployed to:", rewardsAddr);

  // 2. Deploy QIEStaking
  console.log("\n--- Deploying QIEStaking ---");
  const QIEStaking = await hre.ethers.getContractFactory("QIEStaking");
  const staking = await QIEStaking.deploy(QIEPAY_ADDRESS);
  await staking.waitForDeployment();
  const stakingAddr = await staking.getAddress();
  console.log("QIEStaking deployed to:", stakingAddr);

  // 3. Deploy QIEGovernance (depends on staking)
  console.log("\n--- Deploying QIEGovernance ---");
  const QIEGovernance = await hre.ethers.getContractFactory("QIEGovernance");
  const governance = await QIEGovernance.deploy(stakingAddr);
  await governance.waitForDeployment();
  const governanceAddr = await governance.getAddress();
  console.log("QIEGovernance deployed to:", governanceAddr);

  // Summary
  console.log("\n========================================");
  console.log("DEPLOYMENT SUMMARY — QIE Testnet (Chain ID 1983)");
  console.log("========================================");
  console.log("QIERewards:   ", rewardsAddr);
  console.log("QIEStaking:   ", stakingAddr);
  console.log("QIEGovernance:", governanceAddr);
  console.log("========================================");
  console.log("Explorer: https://testnet.qie.digital");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
