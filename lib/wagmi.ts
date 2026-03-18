import { createConfig, http } from 'wagmi';
import { base, mainnet } from 'viem/chains';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { injected, coinbaseWallet, walletConnect } from 'wagmi/connectors';

// Alchemy RPC with API key
const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_KEY || '_cJQ3B3yIO5msQ-IN-z239yz8V4WxZs6';

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
      projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'tachi-quest-wc-v2',
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
      [base.id]: http(`https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`),
      [mainnet.id]: http(`https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`),
    },
  });
}

// Default config for Mini App (most common case)
export const wagmiConfig = getWagmiConfig(true);
