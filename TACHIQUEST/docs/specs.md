Requirements
Created: 2026-03-15 Last Updated: 2026-03-15

App Overview


Field	Value
Type	Social / Quests / Rewards
Target Audience	Farcaster users — community members, $TACHI holders, engaged social participants
Core Experience	Complete Farcaster social actions (recast, follow, quote, like, cast) to earn XP + $TACHI
Visual Style


Field	Value
Vibe	TBD — to be set in Phase 2
Colors	TBD — to be set in Phase 2
Style Direction	TBD — to be set in Phase 2
User's Words: "Farcaster viral miniapp with Farcaster wallet auth social quests"

Core Features
Must-Have (Phase 3 Priority: High)
 Access Gate: Neynar score ≥ 0.7 OR verified badge = instant access; otherwise referral code required
 Farcaster Auth: Pull real profile (pfp, username, displayName, bio, FID, follower/following counts) on login
 Social Quests: 5 quest types — recast, follow, quote cast, like, cast in channel — all unlocked from day 1
 In-App Action Sheet: Tapping "Go →" opens a bottom sheet with the target cast/profile preview and a direct action button; after action user claims rewards
 Dual Rewards: Each quest awards both XP and $TACHI tokens on claim
 $TACHI On-Chain Balance: Read user's real token balance from contract 0x39B4B879b8521d6A8C3a87cda64b969327b7fbA3 on Base
 Referral System: Unique invite link per user, copy + cast-to-Farcaster buttons, milestone rewards (1/3/5/10 referrals), referred users list with Active/Pending status
 Leaderboard: Ranked by XP, current user's row highlighted
 Profile Tab: Farcaster identity, on-chain $TACHI balance, social stats (followers/following/casts), quest XP + rank, earned badges
Nice-to-Have (Phase 3 Priority: Medium)
 Welcome Bonus: Reward screen for users who enter via referral code
 Weekly Leaderboard Toggle: All-time vs weekly view
 Quest Completion Badges: Visual badge collection as quests are completed
Future Considerations (Not in Current Scope)
Admin Quest Management: UI to add/edit/remove quests without code changes
Multi-Campaign Support: Multiple quest sets running simultaneously
Data Requirements


Field	Value
Persistence	Yes
What Needs Saving	Quest completion state, XP totals, referral relationships, referral code entries
User-Specific	Yes — all data is per-user
Authentication	Farcaster wallet auth (FID-based)
Sharing Configuration


Field	Value
Share Button Placement	Profile tab — "Share My Progress" button
shareButtonTitle	"Check My Quests"
Personalization Data	Username, XP earned, $TACHI balance, quests completed count, rank
Technical Constraints


Field	Value
User Skill Level	Non-technical creator
Platform Focus	Mobile-first (Farcaster mini app, 424px viewport)
Special Requirements	$TACHI token CA: 0x39B4B879b8521d6A8C3a87cda64b969327b7fbA3 on Base
Design Decisions & Rationale


Decision	Rationale	Phase
All quests unlocked from start	No gatekeeping friction — let users pick their own starting point	Phase 1
Dual XP + $TACHI rewards	Makes quests feel more valuable with both social and token rewards	Phase 1
Neynar score 0.7+ or verified = open access	Keeps bots out, rewards real community members	Phase 1
Referral code bypass for ineligible users	Still allows growth via trusted community vouching	Phase 1
In-app action sheet (not external link)	Smoother UX — users don't leave the mini app to complete actions	Phase 1
Open Questions
 What are the exact quest targets? (specific cast hashes, @handles to follow, channel slugs)
 Are $TACHI rewards distributed on-chain automatically or manually by admin?
Change Log


Timestamp	Phase	Description
2026-03-15	Phase 1	Initial spec created from planning conversation
