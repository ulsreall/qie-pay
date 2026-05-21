const hre = require("hardhat");

async function main() {
  console.log("Deploying QIEPay to QIE Testnet...");

  // Fee: 250 basis points = 2.5%
  const feePercent = 250;
  const feeRecipient = process.env.FEE_RECIPIENT || process.env.PRIVATE_KEY
    ? new hre.ethers.Wallet(process.env.PRIVATE_KEY).address
    : "0x0000000000000000000000000000000000000000";

  console.log(`Fee: ${feePercent / 100}%`);
  console.log(`Fee Recipient: ${feeRecipient}`);

  const QIEPay = await hre.ethers.getContractFactory("QIEPay");
  const qiePay = await QIEPay.deploy(feePercent, feeRecipient);

  await qiePay.waitForDeployment();

  const address = await qiePay.getAddress();
  console.log(`QIEPay deployed to: ${address}`);
  console.log(`Explorer: https://testnet.qie.digital/address/${address}`);

  // Verify on explorer
  console.log("\nWaiting for block confirmations...");
  await qiePay.deploymentTransaction().wait(5);

  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [feePercent, feeRecipient],
    });
    console.log("Contract verified!");
  } catch (e) {
    console.log("Verification failed (may already be verified):", e.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
