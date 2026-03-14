import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { walletAddress, farcasterFid, farcasterUsername } = body || {}

    if (!walletAddress) {
      return NextResponse.json({ ok: false, error: 'walletAddress required' }, { status: 400 })
    }

    console.log('Airdrop submission:', {
      walletAddress,
      farcasterFid,
      farcasterUsername,
      submittedAt: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Submit error', err)
    return NextResponse.json({ ok: false, error: 'Failed to submit' }, { status: 500 })
  }
}
