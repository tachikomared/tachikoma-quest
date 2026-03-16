// lib/auth-utils.ts - Shared auth utilities
import { sdk } from '@farcaster/miniapp-sdk';

export type AuthUser = {
  id: string;
  fcFid: number;
  fcUsername: string | null;
  fcDisplayName: string | null;
  fcPfpUrl: string | null;
  fcBio: string | null;
  fcScore: number | null;
  fcFollowers: number;
  fcFollowing: number;
  fcPowerBadge: boolean;
  referralCode: string;
  walletAddress: string | null;
  points: number;
};

export type AuthState = 
  | { status: 'loading' }
  | { status: 'authenticated'; user: AuthUser }
  | { status: 'unauthenticated' }
  | { status: 'error'; error: string };

/**
 * Authenticate using Farcaster Mini App SDK (for iframe context)
 */
export async function authWithMiniApp(): Promise<AuthState> {
  try {
    console.log('[auth] Attempting Mini App auth...');
    
    // Use sdk.quickAuth.fetch to get auth token from parent frame
    const res = await sdk.quickAuth.fetch('/api/auth/farcaster/me');
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('[auth] Mini App auth failed:', res.status, errorText);
      return { status: 'error', error: `Auth failed: ${res.status}` };
    }
    
    const data = await res.json();
    
    if (!data.user) {
      console.log('[auth] No user returned from Mini App auth');
      return { status: 'unauthenticated' };
    }
    
    console.log('[auth] Mini App auth success:', data.user.fcFid);
    return { status: 'authenticated', user: data.user };
  } catch (e: any) {
    console.error('[auth] Mini App auth error:', e);
    return { status: 'error', error: e.message || 'Unknown error' };
  }
}

/**
 * Authenticate using cookies (for web context)
 */
export async function authWithCookies(): Promise<AuthState> {
  try {
    console.log('[auth] Attempting cookie auth...');
    
    const res = await fetch('/api/me', { 
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!res.ok) {
      console.error('[auth] Cookie auth failed:', res.status);
      return { status: 'unauthenticated' };
    }
    
    const data = await res.json();
    
    if (!data.user) {
      console.log('[auth] No user in cookie auth');
      return { status: 'unauthenticated' };
    }
    
    console.log('[auth] Cookie auth success:', data.user.fcFid);
    return { status: 'authenticated', user: data.user };
  } catch (e: any) {
    console.error('[auth] Cookie auth error:', e);
    return { status: 'error', error: e.message || 'Unknown error' };
  }
}

/**
 * Universal auth - tries Mini App first, falls back to cookies
 */
export async function authenticate(isMiniApp: boolean): Promise<AuthState> {
  if (isMiniApp) {
    return authWithMiniApp();
  }
  return authWithCookies();
}

/**
 * Sign out - clears session
 */
export async function signOut(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  } catch (e) {
    console.error('[auth] Logout error:', e);
  }
}
