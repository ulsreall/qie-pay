const hre = require("hardhat");

async function main() {
  const dripAmount = hre.ethers.parseEther("0.5");  // 0.5 QIE per drip
  const cooldown = 86400;  // 24 hours

  const Faucet = await hre.ethers.getContractFactory("QIEFaucet");
  const faucet = await Faucet.deploy(dripAmount, cooldown);
  await faucet.waitForDeployment();
  const addr = await faucet.getAddress();
  console.log("QIEFaucet deployed to:", addr);

  // Fund the faucet with 10 QIE
  const [signer] = await hre.ethers.getSigners();
  const fundTx = await signer.sendTransaction({
    to: addr,
    value: hre.ethers.parseEther("10"),
  });
  await fundTx.wait();
  console.log("Faucet funded with 10 QIE");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
