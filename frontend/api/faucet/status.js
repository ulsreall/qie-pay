import { ethers } from 'ethers';

const FAUCET_ADDRESS = '0xe0BC1D6CC58E091F6A2866788D7D938895E1E2a6';
const FAUCET_ABI = [
  'function timeUntilDrip(address _addr) external view returns (uint256)',
  'function dripAmount() external view returns (uint256)',
];

const RPC_URL = 'https://rpc1testnet.qie.digital/';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address } = req.query;
    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid address' });
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const faucet = new ethers.Contract(FAUCET_ADDRESS, FAUCET_ABI, provider);

    const [waitTime, dripAmount] = await Promise.all([
      faucet.timeUntilDrip(address),
      faucet.dripAmount(),
    ]);

    return res.status(200).json({
      address,
      canDrip: waitTime === 0n,
      waitSeconds: Number(waitTime),
      dripAmount: ethers.formatEther(dripAmount),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to check status' });
  }
}
