const API = 'https://api.neynar.com/v2';

function getHeaders() {
  const apiKey = process.env.NEYNAR_API_KEY;
  if (!apiKey) throw new Error('NEYNAR_API_KEY is missing');

  return {
    accept: 'application/json',
    'x-api-key': apiKey,
  };
}

export async function fetchUserWithViewer(targetFid: number, viewerFid: number) {
  const qs = new URLSearchParams({
    fids: String(targetFid),
    viewer_fid: String(viewerFid),
  });

  const res = await fetch(`${API}/farcaster/user/bulk/?${qs.toString()}`, {
    headers: getHeaders(),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Neynar user lookup failed: ${res.status}`);
  }

  const data = await res.json();
  return data.users?.[0] ?? null;
}

export async function verifyFarcasterFollow(viewerFid: number, targetFid: number) {
  const user = await fetchUserWithViewer(targetFid, viewerFid);
  return Boolean(user?.viewer_context?.following);
}

export async function fetchCastWithViewer(identifier: string, type: 'url' | 'hash', viewerFid: number) {
  const qs = new URLSearchParams({
    identifier,
    type,
    viewer_fid: String(viewerFid),
  });

  const res = await fetch(`${API}/farcaster/cast/?${qs.toString()}`, {
    headers: getHeaders(),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Neynar cast lookup failed: ${res.status}`);
  }

  const data = await res.json();
  return data.cast ?? null;
}
