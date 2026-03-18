import { sdk } from '@farcaster/miniapp-sdk';

function fallbackMiniAppDetect(): boolean {
  if (typeof window === 'undefined') return false;
  // Must be in iframe to be a miniapp
  const isEmbedded = window.self !== window.top;
  if (!isEmbedded) return false;
  
  const referrer = document.referrer || '';
  const ancestorOrigins = Array.from(window.location.ancestorOrigins || []);
  const sources = [referrer, ...ancestorOrigins];
  const matches = sources.some((value) => /farcaster|warpcast|wallet\.farcaster/i.test(value));
  return matches;
}

export async function detectMiniApp(): Promise<boolean> {
  try {
    const inMiniApp = await sdk.isInMiniApp();
    if (inMiniApp) return true;
  } catch {
    // ignore
  }

  return fallbackMiniAppDetect();
}
