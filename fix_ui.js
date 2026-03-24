const fs = require('fs');
let page = fs.readFileSync('app/page.tsx', 'utf8');

// Update Role Logic
const oldRole = `  const getHodlRole = (balance: number) => {
    if (balance >= 10000000000) return { label: 'TACHIKOMA PRIME', color: 'text-[#00f0ff] border-[#00f0ff] bg-[#00f0ff]/10' };
    if (balance >= 1000000000) return { label: 'MECHA ACE', color: 'text-[#39ff14] border-[#39ff14] bg-[#39ff14]/10' };
    if (balance >= 100000000) return { label: 'GHOST PILOT', color: 'text-[#ff6b00] border-[#ff6b00] bg-[#ff6b00]/10' };
    if (balance >= 1000000) return { label: 'STEALTH DRONE', color: 'text-[#ff1a1a] border-[#ff1a1a] bg-[#ff1a1a]/10' };
    return { label: 'PROTOCRAB', color: 'text-[#5a5a6a] border-[#5a5a6a] bg-[#5a5a6a]/10' };
  };`;

const newRole = `  const getHodlRole = (balance: number) => {
    if (balance >= 10000000000) return { label: 'TACHIKOMA PRIME', color: 'text-[#00f0ff] border-[#00f0ff] bg-[#00f0ff]/10' };
    if (balance >= 1000000000) return { label: 'MECHA ACE', color: 'text-[#39ff14] border-[#39ff14] bg-[#39ff14]/10' };
    if (balance >= 100000000) return { label: 'GHOST PILOT', color: 'text-[#ff6b00] border-[#ff6b00] bg-[#ff6b00]/10' };
    if (balance >= 10000000) return { label: 'OPERATIVE', color: 'text-[#aa00ff] border-[#aa00ff] bg-[#aa00ff]/10' };
    if (balance >= 1000000) return { label: 'STEALTH DRONE', color: 'text-[#ff1a1a] border-[#ff1a1a] bg-[#ff1a1a]/10' };
    if (balance >= 100000) return { label: 'RECRUIT', color: 'text-[#ffaa00] border-[#ffaa00] bg-[#ffaa00]/10' };
    if (balance >= 1000) return { label: 'SCRAPER', color: 'text-[#888888] border-[#888888] bg-[#888888]/10' };
    return { label: 'PROTOCRAB', color: 'text-[#5a5a6a] border-[#5a5a6a] bg-[#5a5a6a]/10' };
  };`;

page = page.replace(oldRole, newRole);

// Fix balance formatting (remove trailing zeros)
const oldFormat = `const formatNumber = (value: number | string, maxFractionDigits = 0) => {
  const num = Number(value || 0);
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: maxFractionDigits }).format(num);
};`;

const newFormat = `const formatNumber = (value: number | string) => {
  const num = Number(value || 0);
  return parseFloat(num.toFixed(2)).toString();
};`;

page = page.replace(oldFormat, newFormat);

fs.writeFileSync('app/page.tsx', page);
