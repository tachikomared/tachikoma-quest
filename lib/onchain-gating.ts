import { createPublicClient, http, erc20Abi } from 'viem';
import { base } from 'viem/chains';

const client = createPublicClient({
  chain: base,
  transport: http(process.env.RPC_URL),
});

export async function getTokenBalance(wallet: string, contractAddress: string) {
  const balance = await client.readContract({
    address: contractAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [wallet as `0x${string}`],
  });
  
  return balance.toString();
}
