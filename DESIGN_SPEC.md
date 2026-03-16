# TACHI Quest 2.0 - Viral Mecha Crab UI Design

## Core Concept: "The Crab Tank"
A satirical, over-the-top mecha interface inspired by:
- Armored Core / Gundam HUDs
- Degen crypto culture ("gm", "wagmi", "probably nothing")
- Crab/lobster military aesthetic
- Vintage arcade games

## Visual Language

### Colors
- **Primary**: Electric Crimson `#FF1A1A` (warning lights, alerts)
- **Secondary**: Molten Orange `#FF6B00` (heat, energy)
- **Accent**: Toxic Cyan `#00F0FF` (holographic UI elements)
- **Background**: Deep Void `#0A0A0F` / `#050508`
- **Surface**: Gunmetal `#1A1A24` with noise texture
- **Text**: Terminal Green `#39FF14` for stats, Off-white `#F0F0F0` for UI

### Typography
- **Headers**: "Black Ops One" or "Orbitron" - military stencil style
- **Body**: "Share Tech Mono" - terminal/console aesthetic
- **Accents**: "Press Start 2P" - retro gaming pixel font for numbers/stats

### Key UI Elements

#### 1. The Crab Tank (Header)
```
┌─────────────────────────────────────────┐
│  🦀 TACHI-QUEST v2.0           [ XP ]   │
│  ════════════════════════════           │
│  PILOT: @username      FID: #12345      │
└─────────────────────────────────────────┘
```
- Animated scanning line effect
- "System Online" blink indicator
- Rank badge (Private -> General based on XP)

#### 2. Mission Control (Quests)
- Each quest is a "MISSION BRIEFING"
- Status: [PENDING] [ACTIVE] [COMPLETED] [FAILED]
- Reward shown as: "+500 XP | 🦀 100 TACHI"
- Progress bars with "HACKING..." animations

#### 3. War Room (Leaderboard)
- Military ranking system
- "TOP OPERATIVES" table
- Animated rank changes
- "OVERTAKE THEM" CTA for positions above

#### 4. Recruitment Center (Referrals)
- "ENLIST OTHERS" button
- Code displayed as "ACCESS KEY: XXXX-XXXX"
- Progress to next rank
- Squad member avatars

#### 5. Pilot Profile
- Mecha avatar frame with health/shield bars
- "COMBAT STATS" instead of "Followers"
- "TACHI VAULT" with animated coin counter
- Achievement badges as military medals

## Animations & Micro-interactions

### Entrance
- Screen "boots up" with terminal text
- "ESTABLISHING SECURE CONNECTION..."
- Progress bar with retro beep sounds

### Quest Completion
- "MISSION ACCOMPLISHED" banner
- XP counter rolls up like slot machine
- Confetti + crab emoji explosion
- "RANK UP" if threshold crossed

### Loading States
- "CALIBRATING SENSORS..."
- "UPLOADING TO BLOCKCHAIN..."
- "SUMMONING THE CRAB..."

## Satirical Copy

### Instead of "Connect Wallet":
- "ARM THE CRAB"
- "ENGAGE SYSTEMS"

### Instead of "Complete Quest":
- "EXECUTE MISSION"
- "DEPLOY OPERATIVE"

### Instead of "Share":
- "BROADCAST COORDINATES"
- "INITIATE PROPAGANDA"

### Error Messages:
- "CRAB MALFUNCTION DETECTED"
- "SIGNAL LOST - RETRY?"
- "INSUFFICIENT FUEL (TRY AGAIN)"

## Technical Implementation

### CSS Effects
- Scanline overlay (CSS repeating gradient)
- CRT screen flicker animation
- Glitch effect on hover
- Holographic shimmer on cards
- Animated border gradients

### Sound (optional)
- 8-bit coin sound on completion
- Retro "blip" on navigation
- Mechanical whir on loading

## Anti-AI-Slop Features
- Imperfect hand-drawn borders (SVG with slight wobble)
- Variable opacity on scanlines (not perfect)
- Intentional "damage" textures
- Retro pixel imperfections
- Asymmetric layout elements
