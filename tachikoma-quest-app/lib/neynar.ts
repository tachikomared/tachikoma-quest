const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY
const NEYNAR_API_URL = 'https://api.neynar.com/v2'

export async function verifyFarcasterFollow(userFid: number, targetFid: number) {
  try {
    const response = await fetch(
      `${NEYNAR_API_URL}/farcaster/following?fid=${userFid}&viewer_fid=${targetFid}`,
      {
        headers: {
          'accept': 'application/json',
          'api_key': NEYNAR_API_KEY || '',
        },
      }
    )
    
    if (!response.ok) throw new Error('Failed to verify follow')
    
    const data = await response.json()
    return data.users?.some((u: any) => u.fid === targetFid) || false
  } catch (error) {
    console.error('Error verifying follow:', error)
    return false
  }
}

export async function verifyFarcasterRecast(userFid: number, castHash: string) {
  try {
    const response = await fetch(
      `${NEYNAR_API_URL}/farcaster/reactions/cast?cast_hash=${castHash}&reactions_type=recasts`,
      {
        headers: {
          'accept': 'application/json',
          'api_key': NEYNAR_API_KEY || '',
        },
      }
    )
    
    if (!response.ok) throw new Error('Failed to verify recast')
    
    const data = await response.json()
    return data.reactions?.some((r: any) => r.user.fid === userFid) || false
  } catch (error) {
    console.error('Error verifying recast:', error)
    return false
  }
}

export async function getUserByFid(fid: number) {
  try {
    const response = await fetch(
      `${NEYNAR_API_URL}/farcaster/user/bulk?fids=${fid}`,
      {
        headers: {
          'accept': 'application/json',
          'api_key': NEYNAR_API_KEY || '',
        },
      }
    )
    
    if (!response.ok) throw new Error('Failed to fetch user')
    
    const data = await response.json()
    return data.users?.[0]
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}
