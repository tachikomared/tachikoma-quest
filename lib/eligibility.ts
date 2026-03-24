import { sql } from '@/lib/db';

export type EligibilityRules = {
  minFollowers?: number;
  minFollowing?: number;
  minNeynarScore?: number;
  requiresPowerBadge?: boolean;
  tokenBalanceGte?: { contract: string; amount: string };
  // ... other rules
};

export async function evaluateQuestEligibility(
  user: any,
  wallet: string | null,
  neynarProfile: any,
  balances: Record<string, string>,
  questRules: EligibilityRules
) {
  const failures = [];

  if (questRules.minFollowers && (neynarProfile.follower_count || 0) < questRules.minFollowers) {
    failures.push({ code: 'insufficient_followers', message: 'Not enough followers' });
  }

  if (questRules.requiresPowerBadge && !neynarProfile.power_badge) {
    failures.push({ code: 'missing_power_badge', message: 'Requires Power Badge' });
  }

  // Add more rules...

  return {
    eligible: failures.length === 0,
    failures,
    evidence: { neynarProfile, balances }
  };
}
