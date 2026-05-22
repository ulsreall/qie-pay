import { ethers } from 'ethers';

export default function handler(req, res) {
  res.status(200).json({ 
    ok: true, 
    ethersVersion: ethers.version,
    time: new Date().toISOString() 
  });
}
