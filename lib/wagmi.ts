import { createConfig, http } from 'wagmi';
import { base, mainnet } from 'viem/chains';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { injected, coinbaseWallet } from 'wagmi/connectors';

// Exported configs for different modes
// Use getWagmiConfig(isMiniApp) to get the right config at runtime

function getConnectors(isMiniApp: boolean) {
  if (isMiniApp) {
    // Mini App mode: only Farcaster wallet
    return [farcasterMiniApp()];
  }
  // Website mode: injected + Coinbase for browser wallets
  return [
    injected({ target: 'metaMask' }),
    coinbaseWallet({
      appName: 'TACHI Quest',
      preference: 'all',
    }),
    injected(),
  ];
}

export function getWagmiConfig(isMiniApp: boolean) {
  return createConfig({
    chains: [base, mainnet],
    connectors: getConnectors(isMiniApp),
    transports: {
      [base.id]: http(),
      [mainnet.id]: http(),
    },
  });
}

// Default config for Mini App (most common case)
export const wagmiConfig = getWagmiConfig(true);
