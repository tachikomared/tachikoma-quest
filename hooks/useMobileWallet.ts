'use client';

import { useCallback, useState } from 'react';
import { useWriteContract, useAccount } from 'wagmi';
import { WriteContractParameters } from 'wagmi/actions';

/**
 * Hook for mobile wallet deep linking
 * 
 * WalletConnect v2 doesn't auto-open wallets on mobile.
 * This hook fires the transaction first, then deep-links to the wallet.
 * 
 * Pattern: writeAndOpen - TX first, deep link second (2s delay)
 */
export function useMobileWriteContract() {
  const { writeContractAsync, isPending, isSuccess, isError, error, data } = useWriteContract();
  const { connector } = useAccount();
  
  const [isDeepLinking, setIsDeepLinking] = useState(false);

  /**
   * Detect if we're on mobile and not in an in-app browser
   */
  const shouldDeepLink = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isInAppBrowser = Boolean(window.ethereum);
    
    // Skip deep link if:
    // - Not mobile
    // - Already in an in-app browser (like Warpcast)
    return isMobile && !isInAppBrowser;
  }, []);

  /**
   * Open the connected wallet app
   */
  const openWallet = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    // Try to detect wallet from various sources
    const connectorId = connector?.id?.toLowerCase() || '';
    const connectorName = connector?.name?.toLowerCase() || '';
    
    // Check localStorage for WalletConnect session
    let wcWallet = '';
    try {
      const wcKey = Object.keys(localStorage).find(k => k.startsWith('wc@2:client'));
      if (wcKey) {
        const wcData = localStorage.getItem(wcKey) || '';
        wcWallet = wcData.toLowerCase();
      }
    } catch {
      // localStorage might not be available
    }

    const search = `${connectorId} ${connectorName} ${wcWallet}`;

    // Wallet scheme URLs
    const schemes: [string[], string][] = [
      [['rainbow'], 'rainbow://'],
      [['metamask'], 'metamask://'],
      [['coinbase', 'cbwallet'], 'cbwallet://'],
      [['phantom'], 'phantom://'],
      [['trust'], 'trust://'],
      [['zerion'], 'zerion://'],
      [['family'], 'family://'],
    ];

    for (const [keywords, scheme] of schemes) {
      if (keywords.some(k => search.includes(k))) {
        window.location.href = scheme;
        return;
      }
    }

    // Fallback: try generic wallet connect
    window.location.href = 'wc://';
  }, [connector]);

  /**
   * Write contract with mobile deep linking
   * 
   * Usage:
   * const { writeAndOpen, isPending } = useMobileWriteContract();
   * 
   * await writeAndOpen({
   *   address: TACHI_CONTRACT,
   *   abi: ERC20_ABI,
   *   functionName: 'transfer',
   *   args: [recipient, amount],
   * });
   */
  const writeAndOpen = useCallback(async (
    params: WriteContractParameters
  ): Promise<`0x${string}` | undefined> => {
    const needsDeepLink = shouldDeepLink();
    
    if (needsDeepLink) {
      setIsDeepLinking(true);
    }

    try {
      // Fire transaction first (sends request to WalletConnect relay)
      const result = await writeContractAsync(params);
      
      // Then deep link to wallet (2s delay for relay to propagate)
      if (needsDeepLink) {
        setTimeout(() => {
          openWallet();
          setIsDeepLinking(false);
        }, 2000);
      }
      
      return result;
    } catch (e) {
      setIsDeepLinking(false);
      throw e;
    }
  }, [writeContractAsync, shouldDeepLink, openWallet]);

  return {
    // Main function
    writeAndOpen,
    
    // State
    isPending: isPending || isDeepLinking,
    isSuccess,
    isError,
    error,
    data,
    
    // Direct access if needed
    writeContractAsync,
  };
}

/**
 * Hook to detect if we're in Warpcast's in-app browser
 */
export function useIsWarpcast() {
  return useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    // Warpcast injects Frame wallet
    const hasFrame = Boolean((window as any).ethereum?.isFrame);
    
    // Or check URL referrer
    const fromWarpcast = document.referrer?.includes('warpcast.com') || 
                         window.location.href.includes('warpcast');
    
    return hasFrame || fromWarpcast;
  }, []);
}
