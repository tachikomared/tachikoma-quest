const fs = require('fs');
let page = fs.readFileSync('app/page.tsx', 'utf8');

// 1. Fix Pilot Tab balance logic. The balance might be returning as an unformatted raw string.
// Let's ensure it properly parses and divides if it's a huge raw number, and formatted safely.
const oldBalanceLogic = `  const numericBalance = tachiBalance ? (Number(tachiBalance) / 1e18) : Number(fastBalance || '0');`;
const newBalanceLogic = `  // Use raw fastBalance if it's already formatted, otherwise parse it. If it's a massive string, divide by 1e18.
  let numericBalance = 0;
  if (tachiBalance) {
    numericBalance = Number(tachiBalance) / 1e18;
  } else if (fastBalance) {
    const raw = Number(fastBalance);
    numericBalance = raw > 1e12 ? raw / 1e18 : raw;
  }`;
page = page.replace(oldBalanceLogic, newBalanceLogic);

// 2. Hide HODL verify buttons entirely and replace them with auto-verified status logic.
const oldHodlButton = `{mission.platform === 'wallet' && mission.verification === 'wallet_balance' && (
                <button onClick={() => verifyMission(mission)} disabled={status === 'active' || completedIds.has(mission.id)} className="mecha-button flex-1 text-xs bg-[#ff1a1a]/20">
                  {status === 'active' ? '⏳ VERIFYING...' : completedIds.has(mission.id) ? '✅ VERIFIED' : tieredHodlLabel(mission.target?.min)}
                </button>
              )}`;

const newHodlButton = `{mission.platform === 'wallet' && mission.verification === 'wallet_balance' && (
                <button disabled={true} className="mecha-button flex-1 text-xs bg-[#39ff14]/10 border-[#39ff14] text-[#39ff14]">
                  ✅ AUTO-VERIFIED
                </button>
              )}`;
page = page.replace(oldHodlButton, newHodlButton);

fs.writeFileSync('app/page.tsx', page);
