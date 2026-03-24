const fs = require('fs');
let page = fs.readFileSync('app/page.tsx', 'utf8');

const oldFollowLogic = `      if (mission.action === 'follow_user' && mission.target?.targetFid) {
        if (isMiniApp && (sdk as any)?.actions?.followUser) {
          await (sdk as any).actions.followUser({ fid: mission.target.targetFid });
        } else {
          const url = \`https://farcaster.xyz/~/\${mission.target.targetFid}\`;
          await openLink(url);
        }
      }`;

const newFollowLogic = `      if (mission.action === 'follow_user' && mission.target?.targetFid) {
        if (isMiniApp && (sdk as any)?.actions?.viewProfile) {
          await (sdk as any).actions.viewProfile({ fid: mission.target.targetFid });
        } else {
          await openLink(\`https://warpcast.com/~/profiles/\${mission.target.targetFid}\`);
        }
      }`;
page = page.replace(oldFollowLogic, newFollowLogic);
fs.writeFileSync('app/page.tsx', page);
