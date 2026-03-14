import { NextRequest, NextResponse } from 'next/server'
import { verifyFarcasterFollow, verifyFarcasterRecast } from '@/lib/neynar'

export async function POST(req: NextRequest) {
  try {
    const { questId, userFid, walletAddress } = await req.json()

    if (!questId) {
      return NextResponse.json(
        { error: 'Missing questId' },
        { status: 400 }
      )
    }

    let verified = false

    switch (questId) {
      case 'follow-farcaster':
        if (!userFid) {
          return NextResponse.json(
            { error: 'Missing userFid' },
            { status: 400 }
          )
        }
        // @smolekoma FID - replace with actual
        const targetFid = 12345 
        verified = await verifyFarcasterFollow(userFid, targetFid)
        break

      case 'repost-farcaster':
        if (!userFid) {
          return NextResponse.json(
            { error: 'Missing userFid' },
            { status: 400 }
          )
        }
        // Replace with actual cast hash
        const castHash = '0x...'
        verified = await verifyFarcasterRecast(userFid, castHash)
        break

      case 'submit-wallet':
        verified = !!walletAddress && walletAddress.startsWith('0x')
        break

      case 'follow-x':
      case 'repost-x':
        // X verification requires OAuth - mark as pending manual review
        verified = false
        break

      default:
        return NextResponse.json(
          { error: 'Unknown quest' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      verified,
      questId,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Quest verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
