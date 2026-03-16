const API = 'https://api.neynar.com/v2';

function getHeaders() {
  const apiKey = process.env.NEYNAR_API_KEY;
  if (!apiKey) throw new Error('NEYNAR_API_KEY is missing');

  return {
    accept: 'application/json',
    'x-api-key': apiKey,
  };
}

export type NeynarUser = {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  custody_address: string;
  profile: {
    bio: {
      text: string;
    };
  };
  follower_count: number;
  following_count: number;
  power_badge: boolean;
  verified_addresses?: {
    eth_addresses: string[];
    sol_addresses: string[];
  };
  experimental?: {
    neynar_user_score?: number;
  };
};

export async function fetchUserWithViewer(targetFid: number, viewerFid: number): Promise<NeynarUser | null> {
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

export async function fetchUserByFid(fid: number): Promise<NeynarUser | null> {
  const qs = new URLSearchParams({
    fids: String(fid),
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

export async function fetchUserWithScore(fid: number): Promise<NeynarUser | null> {
  const qs = new URLSearchParams({
    fids: String(fid),
  });

  const res = await fetch(`${API}/farcaster/user/bulk/?${qs.toString()}`, {
    headers: {
      ...getHeaders(),
      'x-neynar-experimental': 'true',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Neynar user lookup failed: ${res.status}`);
  }

  const data = await res.json();
  return data.users?.[0] ?? null;
}

export async function verifyFarcasterFollow(viewerFid: number, targetFid: number): Promise<boolean> {
  const user = await fetchUserWithViewer(targetFid, viewerFid);
  return Boolean(user?.viewer_context?.following);
}

export type CastViewerContext = {
  liked: boolean;
  recasted: boolean;
};

export type NeynarCast = {
  hash: string;
  thread_hash: string;
  parent_hash: string | null;
  author: NeynarUser;
  text: string;
  timestamp: string;
  reactions: {
    likes: Array<{ fid: number }>;
    recasts: Array<{ fid: number }>;
  };
  viewer_context?: CastViewerContext;
};

export async function fetchCastWithViewer(
  identifier: string, 
  type: 'url' | 'hash', 
  viewerFid: number
): Promise<NeynarCast | null> {
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
