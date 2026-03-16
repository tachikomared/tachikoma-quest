Wiring Plan
Phase 4 — Feature Planning Created: 2026-03-15

Features Overview


Feature	Type	Mock Being Replaced	Status
Farcaster Auth	Social auth	MOCK_USER everywhere	Phase 5
$TACHI On-Chain Balance	Blockchain (wagmi)	MOCK_USER.onChainTachiBalance	Phase 5
Neynar Score Gate	API (useUser)	user.neynarScore hardcoded	Phase 5
Quest Actions (recast/like/follow/quote/cast)	Social (Neynar hooks)	Mock action in QuestActionSheet	Phase 5
Quest Completion Persistence	Database	In-memory state only	Phase 5
Leaderboard	Database	MOCK_LEADERBOARD	Phase 5
Referral System	Database + Social	MOCK_REFERRALS, MOCK_REFERRAL_REWARDS	Phase 5
Share Button	useShare hook	console.log placeholder	Phase 5
Database Schema
New tables for src/db/schema.ts:

quest_completions — { id uuid, fid int, quest_id int, completed_at timestamp }
user_xp — { fid int unique, username text, pfp_url text, xp int, tachi int, updated_at timestamp }
referrals — { id uuid, referrer_fid int, referred_fid int, code text, status text, joined_at timestamp }
Feature Implementation Details
1. Farcaster Auth
Hook: useFarcasterUser() from @/neynar-farcaster-sdk/mini
Also: useUser(fid, { x_neynar_experimental: true }) for neynar score
Returns: fid, username, display_name, pfp_url, signer_uuid, power_badge, follower_count, following_count, profile.bio.text, verified_addresses.eth_addresses
Files: mini-app.tsx, pass down to all tabs
2. $TACHI Balance
Hook: useReadContract (wagmi) on contract 0x39B4B879b8521d6A8C3a87cda64b969327b7fbA3 (Base)
Function: balanceOf(address) → uint256 (18 decimals)
Requires: NeynarWagmiProvider in providers
Files: profile-tab.tsx, providers-and-initialization.tsx
3. Neynar Score Gate
Hook: useUser(fid, { x_neynar_experimental: true }) from @/neynar-web-sdk/neynar
Score: data.experimental?.neynar_user_score
Verified: data.power_badge
Files: mini-app.tsx → access-gate.tsx
4. Quest Actions
Recast: usePublishReaction({ reaction_type: 'recast', target: castHash, signer_uuid })
Like: usePublishReaction({ reaction_type: 'like', target: castHash, signer_uuid })
Follow: useFollowUser({ target_fid, signer_uuid })
Quote Cast: usePublishCast({ text, embeds: [{cast_id}], signer_uuid })
Cast in channel: usePublishCast({ text, channel_id: 'tachi', signer_uuid })
Files: quest-action-sheet.tsx, update types.ts to add castHash?, targetFid? to QuestTarget
5. Quest Completion Persistence
Actions: markQuestComplete(fid, questId, xp, tachi), getUserQuestCompletions(fid)
Files: src/db/actions/quest-actions.ts, quests-tab.tsx
6. Leaderboard
Actions: getLeaderboard(limit), getUserRank(fid) — reads from user_xp table
Files: src/db/actions/leaderboard-actions.ts, leaderboard-tab.tsx
7. Referral System
Referral code: ${username.toUpperCase()}-${fid} (deterministic, unique per user)
Invite link: URL param ?ref=CODE
Actions: validateReferralCode(code), createReferral(referrerFid, referredFid, code), getReferralsByReferrer(fid)
Files: src/db/actions/referral-actions.ts, referral-tab.tsx, access-gate.tsx
8. Share Button
Hook: useShare() from @/neynar-farcaster-sdk/mini
Delegated to: share-manager subagent
Implementation Order
DB schema + push
Farcaster Auth (real FID everywhere)
Neynar Score Gate (needs real FID)
NeynarWagmiProvider + $TACHI Balance
Quest Completion Persistence (DB)
Quest Actions (needs signer_uuid)
Leaderboard (reads from user_xp)
Referral System (DB + code validation)
Share Button (share-manager)