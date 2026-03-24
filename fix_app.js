const fs = require('fs');

// 1. Fix app/page.tsx
let page = fs.readFileSync('app/page.tsx', 'utf8');

// Remove ENGAGE APP button
page = page.replace(/<a href="https:\/\/farcaster\.xyz\/miniapps\/nLEf2pIdso35\/tachi-quest"[^>]*>[\s\S]*?<\/a>/, '');

// Fix SDK Follow logic in executeMission
const oldExecute = `    if (mission.platform === 'farcaster') {
      // For follow, try SDK's followUser if available, otherwise open profile URL
      if (mission.action === 'follow_user' && mission.target?.targetFid) {
        if (isMiniApp && (sdk as any)?.actions?.followUser) {
          await (sdk as any).actions.followUser({ fid: mission.target.targetFid });
        } else {
          const url = \`https://farcaster.xyz/~/\${mission.target.targetFid}\`;
          await openLink(url);
        }
      } else if (mission.target?.castUrl) {
        await openLink(mission.target.castUrl);
      } else if (mission.target?.castHash) {
        const url = \`https://farcaster.xyz/~/cast/\${mission.target.castHash}\`;
        await openLink(url);
      }
    }`;

const newExecute = `    if (mission.platform === 'farcaster') {
      if (isMiniApp && (sdk as any)?.actions) {
        if (mission.action === 'follow_user' && mission.target?.targetFid) {
          await (sdk as any).actions.viewProfile({ fid: mission.target.targetFid });
        } else if (mission.target?.castHash) {
          await (sdk as any).actions.viewCast({ castHash: mission.target.castHash });
        } else if (mission.target?.castUrl) {
          await (sdk as any).actions.openUrl(mission.target.castUrl);
        } else if (mission.target?.url) {
          await (sdk as any).actions.openUrl(mission.target.url);
        }
      } else {
        const url = mission.target?.castUrl || 
                   (mission.target?.castHash ? \`https://farcaster.xyz/~/cast/\${mission.target.castHash}\` : 
                   (mission.target?.targetFid ? \`https://farcaster.xyz/~/\${mission.target.targetFid}\` : mission.target?.url));
        if (url) await openLink(url);
      }
    }`;
page = page.replace(oldExecute, newExecute);

fs.writeFileSync('app/page.tsx', page);

// 2. Fix api/quests/[id]/verify/route.ts
let route = fs.readFileSync('app/api/quests/[id]/verify/route.ts', 'utf8');

const oldBalanceLogic = `  if (quest.verification === 'wallet_balance' || quest.verification === 'wallet_burn') {
    const minBalance = Number(quest.target.minBalance || '0');`;

const newBalanceLogic = `  if (quest.verification === 'wallet_balance' || quest.verification === 'wallet_burn') {
    const minBalance = Number(quest.target.minBalance || quest.target.min || '0');`;

route = route.replace(oldBalanceLogic, newBalanceLogic);

fs.writeFileSync('app/api/quests/[id]/verify/route.ts', route);

console.log('Fixed files via Node.js script');
