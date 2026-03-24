export function detectClientCapabilities(context: { userAgent?: string }) {
  const ua = context.userAgent?.toLowerCase() || '';
  
  const isFarcasterClient = ua.includes('farcaster') || ua.includes('warpcast');
  const isBaseApp = ua.includes('base');
  
  return {
    isFarcasterClient,
    isBaseApp,
    supportsQuickAuth: isFarcasterClient,
    supportsFarcasterContext: isFarcasterClient,
    prefersWalletAuth: isBaseApp || !isFarcasterClient
  };
}
