import { createConfig, http } from 'wagmi';
import { base, mainnet } from 'viem/chains';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { injected, coinbaseWallet, walletConnect } from 'wagmi/connectors';

// Exported configs for different modes
// Use getWagmiConfig(isMiniApp) to get the right config at runtime

function getConnectors(isMiniApp: boolean) {
  if (isMiniApp) {
    // Mini App mode: only Farcaster wallet
    return [farcasterMiniApp()];
  }
  // Website mode: multiple wallet options for browser
  return [
    injected({ target: 'metaMask' }),
    coinbaseWallet({
      appName: 'TACHI Quest',
      preference: 'all',
    }),
    // Phantom via WalletConnect (enables Phantom on desktop + mobile)
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'tachi-quest-default',
      metadata: {
        name: 'TACHI Quest',
        description: 'The ultimate Farcaster Mini App adventure',
        url: 'https://tachi-quest.vercel.app',
        icons: ['https://tachi-quest.vercel.app/icon.png'],
      },
    }),
    injected(), // Fallback for other injected wallets
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
