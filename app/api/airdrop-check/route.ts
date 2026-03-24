export const dynamic = "force-dynamic";
import { sql } from '@/lib/db';
import { NextRequest } from 'next/server';


export async function GET(req: NextRequest) {
  // In a real app, we'd use the user's wallet address or session.
  // This is a placeholder for actual eligibility logic.
  
  // Example query structure for TACHI holder airdrop check:
  // const userAddress = '0x...'; // Get from session
  // const [data] = await sql`
  //   SELECT * FROM airdrop_eligibility WHERE address = ${userAddress}
  // `;

  return Response.json({
    eligible: true,
    amount: 1000,
    reason: 'Active Tachi Quest Participant'
  });
}
