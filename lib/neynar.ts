export type NeynarUser = {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  power_badge: boolean;
  score?: number;
  profile?: { bio?: { text?: string } };
  experimental?: { neynar_user_score?: number };
  follower_count?: number;
  following_count?: number;
};

export async function fetchNeynarProfile(fid: number): Promise<NeynarUser | null> {
  try {
    const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
      headers: { 'api-key': process.env.NEYNAR_API_KEY! }
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.users[0];
  } catch {
    return null;
  }
}

export async function hydrateProfile(fid: number) {
  const profile = await fetchNeynarProfile(fid);
  if (!profile) return null;
  return profile;
}

export async function fetchUserWithScore(fid: number): Promise<NeynarUser | null> {
  const profile = await fetchNeynarProfile(fid);
  if (!profile) return null;
  // Mock score
  return { ...profile, score: 0.9 };
}

export async function verifyFarcasterFollow(fid: number, targetFid: number): Promise<boolean> {
  try {
    const response = await fetch(`https://api.neynar.com/v2/farcaster/user/following?fid=${fid}&target_fids=${targetFid}`, {
      headers: { 'api-key': process.env.NEYNAR_API_KEY! }
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data.users.length > 0;
  } catch {
    return false;
  }
}

export async function fetchCastWithViewer(identifier: string, type: 'hash' | 'url', viewerFid: number) {
  try {
    const response = await fetch(`https://api.neynar.com/v2/farcaster/cast?identifier=${identifier}&type=${type}&viewer_fid=${viewerFid}`, {
      headers: { 'api-key': process.env.NEYNAR_API_KEY! }
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.cast;
  } catch {
    return null;
  }
}

export async function searchCasts(query: string, targetFid?: number, viewerFid?: number, limit: number = 25) {
  try {
    const url = new URL('https://api.neynar.com/v2/farcaster/cast/search');
    url.searchParams.append('q', query);
    if (viewerFid) url.searchParams.append('viewer_fid', viewerFid.toString());
    url.searchParams.append('limit', limit.toString());
    
    const response = await fetch(url.toString(), {
      headers: { 'api-key': process.env.NEYNAR_API_KEY! }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.result?.casts || [];
  } catch {
    return [];
  }
}
