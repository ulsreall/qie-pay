const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "QIE");

  // Fee: 250 basis points = 2.5%
  const feePercent = 250;
  const feeRecipient = deployer.address;

  console.log(`Fee: ${feePercent / 100}%`);
  console.log(`Fee Recipient: ${feeRecipient}`);

  const QIEPay = await hre.ethers.getContractFactory("QIEPay", deployer);
  const qiePay = await QIEPay.deploy(feePercent, feeRecipient);

  await qiePay.waitForDeployment();

  const address = await qiePay.getAddress();
  console.log(`\nQIEPay deployed to: ${address}`);
  console.log(`Explorer: https://testnet.qie.digital/address/${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
