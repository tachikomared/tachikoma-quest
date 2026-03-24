export async function fetchNeynarProfile(fid: number) {
  // Mocking Neynar API call
  // Use official docs: https://docs.neynar.com/docs/get-user-profile
  const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
    headers: { 'api-key': process.env.NEYNAR_API_KEY! }
  });
  
  if (!response.ok) return null;
  const data = await response.json();
  return data.users[0];
}

export async function hydrateProfile(fid: number) {
  const profile = await fetchNeynarProfile(fid);
  if (!profile) return null;

  // Persist to DB
  // ... sql update user table
  return profile;
}
