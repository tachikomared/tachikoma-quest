'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, Button, Input, H3, P } from '@neynar/ui';
import { validateReferralCode, createReferral } from '@/db/actions/referral-actions';
import type { AccessState } from '@/features/app/types';

type AccessGateProps = {
  fid: number;
  username: string;
  pfpUrl: string;
  neynarScore: number;
  isVerified: boolean;
  isLoading: boolean;
  defaultRefCode?: string;
  onEnter: () => void;
};

export function AccessGate({
  fid,
  username,
  pfpUrl,
  neynarScore,
  isVerified,
  isLoading,
  defaultRefCode = '',
  onEnter,
}: AccessGateProps) {
  const [state, setState] = useState<AccessState>('checking');
  const [refCode, setRefCode] = useState(defaultRefCode);
  const [refError, setRefError] = useState('');

  useEffect(() => {
    // Wait until we have real auth data
    if (isLoading) return;

    const eligible = neynarScore >= 0.7 || isVerified;
    if (eligible) {
      setState('granted');
    } else if (defaultRefCode) {
      // If user arrived via referral link and isn't eligible, jump straight to ref-entry
      setState('ref-entry');
    } else {
      setState('blocked');
    }
  }, [isLoading, neynarScore, isVerified, defaultRefCode]);

  const handleRefSubmit = async () => {
    setRefError('');
    const result = await validateReferralCode(refCode);
    if (!result) {
      setRefError('Invalid referral code. Ask a community member for their invite link!');
      return;
    }

    // Create the referral record
    await createReferral(result.referrerFid, fid, refCode.toUpperCase());
    setState('ref-success');
    setTimeout(onEnter, 1500);
  };

  if (state === 'checking' || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <div className="w-16 h-16 rounded-full bg-red-950 border border-red-800 flex items-center justify-center text-3xl animate-pulse">🔍</div>
        <H3 className="text-foreground">Checking eligibility...</H3>
        <P className="text-sm text-muted-foreground text-center">Verifying your Farcaster account</P>
        <div className="flex gap-1 mt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-red-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (state === 'granted') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <div className="w-20 h-20 rounded-full bg-green-950 border border-green-700 flex items-center justify-center text-4xl">✅</div>
        <H3 className="text-foreground">You're in.</H3>
        <div className="flex flex-col gap-2 w-full">
          <Card className="border-red-900 bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <img src={pfpUrl} alt="" className="w-10 h-10 rounded-full border-2 border-red-700" />
                <div className="flex-1">
                  <p className="font-bold text-sm text-foreground">@{username}</p>
                  <p className="text-xs text-muted-foreground">FID #{fid}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Neynar Score</p>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${Math.min(neynarScore * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-green-500">{neynarScore.toFixed(2)} ✓</span>
                  </div>
                </div>
                {isVerified && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Power Badge</p>
                    <span className="text-xs font-bold text-red-400">✓ Verified</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        <Button onClick={onEnter} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold">
          Start Questing →
        </Button>
      </div>
    );
  }

  if (state === 'ref-success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <div className="w-20 h-20 rounded-full bg-green-950 border border-green-700 flex items-center justify-center text-4xl animate-bounce">🎉</div>
        <H3 className="text-foreground">Referral accepted!</H3>
        <P className="text-sm text-muted-foreground text-center">Welcome to Tachi Quests. The mecha crab awaits...</P>
      </div>
    );
  }

  if (state === 'ref-entry') {
    return (
      <div className="flex flex-col gap-4 px-4 pt-8">
        <div className="flex flex-col items-center gap-3 mb-2">
          <div className="w-16 h-16 rounded-full bg-yellow-950 border border-yellow-800 flex items-center justify-center text-3xl">🔑</div>
          <H3 className="text-foreground">Enter Referral Code</H3>
          <P className="text-sm text-muted-foreground text-center">Get an invite code from someone already in the community</P>
        </div>
        <Card className="border-red-900 bg-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-2">Referral Code</p>
            <Input
              placeholder="e.g. ALICE-12345"
              value={refCode}
              onChange={(e) => {
                setRefCode(e.target.value);
                setRefError('');
              }}
              className="bg-background border-red-900 text-foreground uppercase font-mono"
            />
            {refError && <p className="text-xs text-red-500 mt-2">{refError}</p>}
          </CardContent>
        </Card>
        <Button onClick={handleRefSubmit} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold">
          Submit Code
        </Button>
        <button onClick={() => setState('blocked')} className="text-xs text-muted-foreground text-center py-2">
          ← Back
        </button>
      </div>
    );
  }

  // blocked
  return (
    <div className="flex flex-col items-center gap-4 px-4 pt-8">
      <div className="w-20 h-20 rounded-full bg-red-950 border border-red-800 flex items-center justify-center text-4xl">🚫</div>
      <H3 className="text-foreground">Access Restricted</H3>
      <Card className="border-red-900 bg-card w-full">
        <CardContent className="p-4">
          <P className="text-sm text-center text-muted-foreground mb-4">
            Tachi Quests is invite-only for accounts below the eligibility threshold.
          </P>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <p className="text-xs text-muted-foreground">Neynar Score required</p>
              <span className="text-xs font-bold text-foreground">≥ 0.70</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <p className="text-xs text-muted-foreground">Your score</p>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${Math.min(neynarScore * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-red-500">{neynarScore.toFixed(2)} ✗</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <p className="text-xs text-muted-foreground">Power Badge</p>
              <span className="text-xs font-bold text-red-500">Not verified ✗</span>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex flex-col gap-2 w-full">
        <Button
          onClick={() => setState('ref-entry')}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
        >
          🔑 I Have a Referral Code
        </Button>
        <Button variant="outline" className="w-full border-red-900 text-foreground">
          How to get verified? ↗
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center">Scores improve with account activity over time</p>
    </div>
  );
}

