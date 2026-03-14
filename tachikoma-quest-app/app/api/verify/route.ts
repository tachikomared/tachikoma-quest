import { NextResponse } from 'next/server'
import { verifyFarcasterFollow, verifyFarcasterRecast } from '@/lib/neynar'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const fid = searchParams.get('fid')
  const type = searchParams.get('type')

  if (!fid || !type) {
    return NextResponse.json({ verified: false, error: 'Missing fid or type' }, { status: 400 })
  }

  const userFid = Number(fid)

  try {
    if (type === 'follow') {
      const targetFid = Number(process.env.NEYNAR_TARGET_FID || 0)
      if (!targetFid) {
        return NextResponse.json({ verified: false, error: 'Missing target fid' }, { status: 400 })
      }

      const verified = await verifyFarcasterFollow(userFid, targetFid)
      return NextResponse.json({ verified })
    }

    if (type === 'recast') {
      const castHash = process.env.NEYNAR_CAST_HASH || ''
      if (!castHash) {
        return NextResponse.json({ verified: false, error: 'Missing cast hash' }, { status: 400 })
      }

      const verified = await verifyFarcasterRecast(userFid, castHash)
      return NextResponse.json({ verified })
    }

    return NextResponse.json({ verified: false, error: 'Unsupported type' }, { status: 400 })
  } catch (err) {
    console.error('Verification error', err)
    return NextResponse.json({ verified: false }, { status: 500 })
  }
}
