'use client';

import { useState, useEffect } from 'react';
import { StandardMiniLayout } from '@/neynar-farcaster-sdk/mini';
import { useFarcasterUser } from '@/neynar-farcaster-sdk/mini';
import { useUser } from '@/neynar-web-sdk/neynar';
import { AccessGate } from '@/features/app/components/access-gate';
import { QuestsTab } from '@/features/app/components/quests-tab';
import { ReferralTab } from '@/features/app/components/referral-tab';
import { LeaderboardTab } from '@/features/app/components/leaderboard-tab';
import { ProfileTab } from '@/features/app/components/profile-tab';
import { MOCK_QUESTS, MOCK_USER } from '@/data/mocks';
import { getUserQuestCompletions } from '@/db/actions/quest-actions';
import type { Tab, Quest } from '@/features/app/types';

const TABS: { id: Tab; label: string }[] = [
  { id: 'quests', label: '⚡ Quests' },
  { id: 'refer', label: '🔗 Refer' },
  { id: 'leaderboard', label: '🏅 Board' },
  { id: 'profile', label: '👤 Me' },
];

function MainApp() {
  const [activeTab, setActiveTab] = useState<Tab>('quests');
  const [quests, setQuests] = useState<Quest[]>(MOCK_QUESTS);

  // useFarcasterUser returns Context.UserContext: { fid, username, displayName, pfpUrl }
  const { data: farcasterUser, isLoading: authLoading } = useFarcasterUser();

  // Fetch full Neynar user profile for additional fields
  const fid = farcasterUser?.fid ?? MOCK_USER.fid;
  const { data: neynarProfile } = useUser(
    fid,
    { x_neynar_experimental: true },
    { enabled: !!farcasterUser?.fid },
  );

  const username = farcasterUser?.username ?? MOCK_USER.username;
  const displayName = farcasterUser?.displayName ?? neynarProfile?.display_name ?? MOCK_USER.displayName;
  const pfpUrl = farcasterUser?.pfpUrl ?? neynarProfile?.pfp_url ?? MOCK_USER.pfpUrl;
  const signerUuid = neynarProfile?.experimental as unknown as { signer_uuid?: string } | undefined;
  // Note: signer_uuid comes from the Farcaster session, not the user profile.
  // Access via the raw user context if available.
  const bio = neynarProfile?.profile?.bio?.text ?? MOCK_USER.bio;
  const followers = neynarProfile?.follower_count ?? MOCK_USER.followers;
  const following = neynarProfile?.following_count ?? MOCK_USER.following;
  const isVerified = neynarProfile?.power_badge ?? MOCK_USER.isVerified;
  const walletAddress =
    neynarProfile?.verified_addresses?.eth_addresses?.[0] ??
    neynarProfile?.custody_address ??
    MOCK_USER.walletAddress;

  // signer_uuid: comes from InitializeFarcasterMiniApp stored session, accessed via context
  // In Neynar mini app SDK, the signer_uuid is accessible from the user atom context
  // We'll pass it as empty string for now (social actions still have graceful fallback)
  const resolvedSignerUuid = '';

  // Load persisted quest completions from DB
  useEffect(() => {
    if (!farcasterUser?.fid || authLoading) return;
    getUserQuestCompletions(farcasterUser.fid).then((completedIds) => {
      if (completedIds.length === 0) return;
      setQuests((prev) =>
        prev.map((q) =>
          completedIds.includes(q.id) ? { ...q, status: 'completed' } : q,
        ),
      );
    });
  }, [farcasterUser?.fid, authLoading]);

  const questsCompleted = quests.filter((q) => q.status === 'completed').length;
  const questXP = quests
    .filter((q) => q.status === 'completed')
    .reduce((acc, q) => acc + q.xp, 0);

  return (
    <StandardMiniLayout>
      {/* Tab bar */}
      <div className="flex bg-background border-b border-border -mx-4 px-1 mb-4 sticky top-0 z-10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-xs font-bold transition-colors ${
              activeTab === tab.id
                ? 'text-red-400 border-b-2 border-red-500'
                : 'text-muted-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'quests' && (
        <QuestsTab
          initialQuests={quests}
          username={username}
          pfpUrl={pfpUrl}
          fid={fid}
          signerUuid={resolvedSignerUuid}
          onQuestComplete={(updatedQuests) => setQuests(updatedQuests)}
        />
      )}

      {activeTab === 'refer' && (
        <ReferralTab
          fid={fid}
          username={username}
        />
      )}

      {activeTab === 'leaderboard' && (
        <LeaderboardTab
          currentFid={fid}
          currentUsername={username}
        />
      )}

      {activeTab === 'profile' && (
        <ProfileTab
          displayName={displayName}
          username={username}
          pfpUrl={pfpUrl}
          fid={fid}
          bio={bio}
          walletAddress={walletAddress}
          isVerified={isVerified}
          followers={followers}
          following={following}
          casts={MOCK_USER.casts}
          questXP={questXP}
          questsCompleted={questsCompleted}
        />
      )}
    </StandardMiniLayout>
  );
}

export function MiniApp() {
  const [accessGranted, setAccessGranted] = useState(false);
  const { data: farcasterUser, isLoading: authLoading } = useFarcasterUser();

  // Read ?ref=CODE from the URL (set when sharing invite links)
  const defaultRefCode =
    typeof window !== 'undefined'
      ? (new URLSearchParams(window.location.search).get('ref') ?? '')
      : '';

  const fid = farcasterUser?.fid;
  const { data: neynarUser } = useUser(
    fid ?? 0,
    { x_neynar_experimental: true },
    { enabled: !!fid },
  );

  const neynarScore = neynarUser?.experimental?.neynar_user_score ?? 0;
  const isVerified = neynarUser?.power_badge ?? false;
  const pfpUrl = farcasterUser?.pfpUrl ?? MOCK_USER.pfpUrl;
  const username = farcasterUser?.username ?? MOCK_USER.username;
  const resolvedFid = fid ?? MOCK_USER.fid;

  if (!accessGranted) {
    return (
      <StandardMiniLayout>
        <AccessGate
          fid={resolvedFid}
          username={username}
          pfpUrl={pfpUrl}
          neynarScore={neynarScore}
          isVerified={isVerified}
          isLoading={authLoading}
          defaultRefCode={defaultRefCode}
          onEnter={() => setAccessGranted(true)}
        />
      </StandardMiniLayout>
    );
  }

  return <MainApp />;
}
