     1|const hre = require("hardhat");
     2|
     3|async function main() {
     4|  const dripAmount = hre.ethers.parseEther("2");  // 2 QIE per drip
     5|  const cooldown = 86400;  // 24 hours
     6|
     7|  const Faucet = await hre.ethers.getContractFactory("QIEFaucet");
     8|  const faucet = await Faucet.deploy(dripAmount, cooldown);
     9|  await faucet.waitForDeployment();
    10|  const addr = await faucet.getAddress();
    11|  console.log("QIEFaucet deployed to:", addr);
    12|
    13|  // Fund the faucet with 10 QIE
    14|  const [signer] = await hre.ethers.getSigners();
    15|  const fundTx = await signer.sendTransaction({
    16|    to: addr,
    17|    value: hre.ethers.parseEther("10"),
    18|  });
    19|  await fundTx.wait();
    20|  console.log("Faucet funded with 10 QIE");
    21|}
    22|
    23|main().catch((error) => {
    24|  console.error(error);
    25|  process.exitCode = 1;
    26|});
    27|