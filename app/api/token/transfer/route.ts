import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireCurrentUser } from '@/lib/auth';

const BodySchema = z.object({
  toAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid recipient address'),
  amount: z.string().min(1, 'Amount required'),
});

export async function POST(req: Request) {
  try {
    const current = await requireCurrentUser();
    
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parseResult = BodySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { toAddress, amount } = parseResult.data;

    // Get user's wallet from DB
    const { sql } = await import('@/lib/db');
    const rows = await sql`
      SELECT w.address AS wallet_address
      FROM wallets w
      JOIN users u ON u.id = w.user_id
      WHERE u.fc_fid = ${current.fid} AND w.verified = true
      LIMIT 1
    `;
    
    const fromAddress = rows[0]?.wallet_address;
    
    if (!fromAddress) {
      return NextResponse.json(
        { error: 'No wallet linked' },
        { status: 400 }
      );
    }

    // Return transaction data for client to sign and send
    // The actual transaction signing happens on the client with wagmi/viem
    return NextResponse.json({
      ok: true,
      tx: {
        from: fromAddress,
        to: toAddress,
        amount,
        tokenContract: '0x39B4B879b8521d6A8C3a87cda64b969327b7fbA3',
        // Client should use wagmi's writeContract to transfer ERC20 tokens
      },
    });
  } catch (e: any) {
    console.error('[token/transfer] Error:', e);
    return NextResponse.json(
      { error: e.message || 'Transfer failed' },
      { status: 500 }
    );
  }
}
