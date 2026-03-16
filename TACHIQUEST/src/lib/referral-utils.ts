/**
 * Generate a deterministic referral code for a user.
 * Format: USERNAME-FID (uppercase, no spaces)
 * This is a pure utility function safe to use on both client and server.
 */
export function generateReferralCode(username: string, fid: number): string {
  return `${username.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${fid}`;
}