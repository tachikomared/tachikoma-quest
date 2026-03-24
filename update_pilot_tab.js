const fs = require('fs');
let page = fs.readFileSync('app/page.tsx', 'utf8');

// Logic to replace the PilotTab to auto-calculate tiers/roles
const oldPilotTab = `  const getHodlTier = (balance: number) => {
    if (balance >= 10000000000) return { label: '10B HODL LVL', color: 'text-[#00f0ff] border-[#00f0ff] bg-[#00f0ff]/10' };
    if (balance >= 1000000000) return { label: '1B HODL LVL', color: 'text-[#39ff14] border-[#39ff14] bg-[#39ff14]/10' };
    if (balance >= 100000000) return { label: '100M HODL LVL', color: 'text-[#ff6b00] border-[#ff6b00] bg-[#ff6b00]/10' };
    if (balance >= 10000000) return { label: '10M HODL LVL', color: 'text-[#ff1a1a] border-[#ff1a1a] bg-[#ff1a1a]/10' };
    if (balance >= 1000000) return { label: '1M HODL LVL', color: 'text-[#00f0ff] border-[#00f0ff] bg-[#00f0ff]/10' };
    if (balance >= 100000) return { label: '100K HODL LVL', color: 'text-[#39ff14] border-[#39ff14] bg-[#39ff14]/10' };
    if (balance >= 10000) return { label: '10K HODL LVL', color: 'text-[#ff6b00] border-[#ff6b00] bg-[#ff6b00]/10' };
    if (balance >= 1000) return { label: '1K HODL LVL', color: 'text-[#ff1a1a] border-[#ff1a1a] bg-[#ff1a1a]/10' };
    if (balance >= 100) return { label: '100 HODL LVL', color: 'text-[#00f0ff] border-[#00f0ff] bg-[#00f0ff]/10' };
    return { label: 'NO HODL', color: 'text-[#5a5a6a] border-[#5a5a6a] bg-[#5a5a6a]/10' };
  };`;

const newPilotTab = `  const getHodlRole = (balance: number) => {
    if (balance >= 10000000000) return { label: 'TACHIKOMA PRIME', color: 'text-[#00f0ff] border-[#00f0ff] bg-[#00f0ff]/10' };
    if (balance >= 1000000000) return { label: 'MECHA ACE', color: 'text-[#39ff14] border-[#39ff14] bg-[#39ff14]/10' };
    if (balance >= 100000000) return { label: 'GHOST PILOT', color: 'text-[#ff6b00] border-[#ff6b00] bg-[#ff6b00]/10' };
    if (balance >= 1000000) return { label: 'STEALTH DRONE', color: 'text-[#ff1a1a] border-[#ff1a1a] bg-[#ff1a1a]/10' };
    return { label: 'PROTOCRAB', color: 'text-[#5a5a6a] border-[#5a5a6a] bg-[#5a5a6a]/10' };
  };`;

page = page.replace(oldPilotTab, newPilotTab);
// Note: need to also update the function call inside the return jsx
page = page.replace(/getHodlTier/g, 'getHodlRole');

fs.writeFileSync('app/page.tsx', page);
