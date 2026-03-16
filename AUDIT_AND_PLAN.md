# TACHI Quest - Complete Audit & Fix Plan

## 🔍 Current State Audit

### Local Files (✅ Correct)
```
app/
├── page.tsx           ✅ 416 lines, Military UI
├── layout.tsx         ✅ Imports mecha-theme.css
├── globals.css        ✅ Base styles
├── mecha-theme.css    ✅ 200+ lines, Military theme
├── providers.tsx      ✅ Updated
└── api/               ✅ All routes working
```

### Deployed State (❌ Wrong)
- ❌ Showing OLD UI (Quests/Leaderboard/Referrals/Profile)
- ❌ Missing mecha-theme.css styles
- ❌ No military fonts loaded
- ❌ No CRT/scanline effects

### Root Cause
Next.js is NOT bundling `mecha-theme.css` into the production build.

The CSS imports in layout.tsx aren't being processed correctly.

---

## ✅ Fix Plan

### Step 1: Merge CSS Files
Combine mecha-theme.css INTO globals.css so it's guaranteed to be bundled.

### Step 2: Simplify Layout
Remove complex font loading, use standard Next.js patterns.

### Step 3: Test Build Locally
Run `npm run build` to verify it works before deploying.

### Step 4: Force Clean Deploy
- Clear all caches
- Delete .next folder
- Deploy fresh

### Step 5: Verify
Check that deployed CSS contains military styles.

---

## 🔧 Implementation

### Files to Modify:
1. **app/globals.css** - Add all mecha-theme.css content
2. **app/layout.tsx** - Remove mecha-theme.css import
3. **app/mecha-theme.css** - Can delete or keep as backup

### Verification Commands:
```bash
# Local build test
cd /home/tachiboss/tachi/workspace-agents/builder
npm run build

# Check CSS in build
grep -r "mecha-button\|scanlines\|TACHI-QUEST" .next/static/css/

# Deploy
vercel --prod

# Verify deployed
curl -s https://tachi-quest.vercel.app | grep -E "MISSIONS|mecha-button"
```

---

## 📋 Current Issues

1. **CSS Not Loading**: mecha-theme.css not in production bundle
2. **Font Loading**: Google Fonts may not be loading in Mini App context
3. **Tailwind Conflict**: Custom CSS may conflict with Tailwind
4. **Build Cache**: Vercel may be caching old builds

---

## 🎯 Success Criteria

After fix, opening https://tachi-quest.vercel.app should show:
- [ ] Header says "TACHI-QUEST" (not "TACHI Quest")
- [ ] Tabs say "MISSIONS / WAR ROOM / ENLIST / PILOT"
- [ ] Red crimson buttons with military styling
- [ ] Dark void background (#050508)
- [ ] CRT scanline effect visible

---

## ⚡ Quick Fix Strategy

Instead of fighting Next.js CSS bundling, use Tailwind + inline styles:

1. Keep Tailwind as primary styling
2. Add custom styles via `<style jsx global>` in layout
3. This guarantees styles are included in SSR

This approach bypasses all CSS import issues.
