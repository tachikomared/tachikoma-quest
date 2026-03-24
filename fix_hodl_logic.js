const fs = require('fs');
let page = fs.readFileSync('app/page.tsx', 'utf8');

// We need to ensure `numericBalance` is accessible within `MissionsTab`.
// The current `MissionsTab` scope doesn't have `numericBalance` defined.
// I will move the numericBalance fetching/calculation into MissionsTab.

const addBalanceToMissionsTab = `  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [numericBalance, setNumericBalance] = useState(0); // Add this
  const [receiptModal, setReceiptModal] = useState<{ isOpen: boolean; quest: any; }>({ isOpen: false, quest: null });`;

page = page.replace(/  const \[completedIds, setCompletedIds\] = useState<Set<string>>\(new Set\(\)\);/, addBalanceToMissionsTab);

// Add the logic to update numericBalance inside MissionsTab
const balanceFetchEffect = `
  useEffect(() => {
    if (!address) return;
    fetch('/api/token/balance')
      .then(r => r.json())
      .then(d => setNumericBalance(Number(d?.balance ?? d?.formattedBalance ?? 0)))
      .catch(() => null);
  }, [address]);
`;

// Insert after the last useEffect
page = page.replace(/  const refreshCompletions = async \(\) => \{/, balanceFetchEffect + '\n  const refreshCompletions = async () => {');

fs.writeFileSync('app/page.tsx', page);
