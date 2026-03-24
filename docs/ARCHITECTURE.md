# Architecture

Dual-path app: Farcaster Miniapp (via FID + Quick Auth) OR Base web app (via SIWE + Wallet). We use lib/client.ts to detect the environment and direct user authentication to lib/auth.ts (AuthMode: farcaster | base_web).

Quests are powered by lib/eligibility.ts which queries lib/onchain-gating.ts for Base token evaluations and lib/neynar.ts for Farcaster profile metrics.
