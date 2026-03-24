const fs = require('fs');
let page = fs.readFileSync('app/page.tsx', 'utf8');

// The issue is that the HODL quest button logic for verification is now hardcoded to '✅ AUTO-VERIFIED'
// We need to re-introduce the logic to check the balance against the quest target requirement.

const oldHodlButton = `{mission.platform === 'wallet' && mission.verification === 'wallet_balance' && (
                <button disabled={true} className="mecha-button flex-1 text-xs bg-[#39ff14]/10 border-[#39ff14] text-[#39ff14]">
                  ✅ AUTO-VERIFIED
                </button>
              )}`;

const newHodlButton = `{mission.platform === 'wallet' && mission.verification === 'wallet_balance' && (
                <button disabled={true} className={\`mecha-button flex-1 text-xs \${numericBalance >= (mission.target?.min || 0) ? 'bg-[#39ff14]/10 border-[#39ff14] text-[#39ff14]' : 'bg-[#5a5a6a]/10 border-[#5a5a6a] text-[#8a8a9a]'}\`}>
                  {numericBalance >= (mission.target?.min || 0) ? '✅ ACHIEVED' : '🔒 LOCKED'}
                </button>
              )}`;
page = page.replace(oldHodlButton, newHodlButton);

fs.writeFileSync('app/page.tsx', page);
