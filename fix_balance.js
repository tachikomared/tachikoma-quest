const fs = require('fs');
let page = fs.readFileSync('app/page.tsx', 'utf8');

// Define balance state
const balanceState = `  const [numericBalance, setNumericBalance] = useState(0);
  useEffect(() => {
    fetch('/api/token/balance')
      .then(r => r.json())
      .then(d => setNumericBalance(Number(d?.balance ?? d?.formattedBalance ?? 0)))
      .catch(() => null);
  }, []);
`;

// Insert after the existing mission state definitions
page = page.replace(/  const \[completedIds, setCompletedIds\] = useState<Set<string>>\(new Set\(\)\);/, 
                    `  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());\n${balanceState}`);

// Update the Hodl button to use numericBalance
const oldHodlButton = `{mission.platform === 'wallet' && mission.verification === 'wallet_balance' && (
                <button onClick={() => verifyMission(mission)} disabled={status === 'active' || completedIds.has(mission.id)} className="mecha-button flex-1 text-xs bg-[#ff1a1a]/20">
                  {status === 'active' ? '⏳ VERIFYING...' : completedIds.has(mission.id) ? '✅ VERIFIED' : tieredHodlLabel(mission.target?.min)}
                </button>
              )}`;

const newHodlButton = `{mission.platform === 'wallet' && mission.verification === 'wallet_balance' && (
                <button disabled={true} className={\`mecha-button flex-1 text-xs \${numericBalance >= (mission.target?.min || 0) ? 'bg-[#39ff14]/10 border-[#39ff14] text-[#39ff14]' : 'bg-[#5a5a6a]/10 border-[#5a5a6a] text-[#8a8a9a]'}\`}>
                  {numericBalance >= (mission.target?.min || 0) ? '✅ ACHIEVED' : '🔒 LOCKED'}
                </button>
              )}`;
page = page.replace(oldHodlButton, newHodlButton);

fs.writeFileSync('app/page.tsx', page);
