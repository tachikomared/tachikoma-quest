export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { fetchUserWithScore } from '@/lib/neynar';
import { requireCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const current = await requireCurrentUser();

    // Skip for guest users
    if (current.fid === 0) {
      return NextResponse.json({ success: true, skipped: true, reason: 'guest_user' });
    }

    // Fetch fresh data from Neynar
    const neynarUser = await fetchUserWithScore(current.fid);
    
    if (!neynarUser) {
      return NextResponse.json({ error: 'Neynar user not found' }, { status: 404 });
    }
    
    // Update user in database
    await sql`
      UPDATE users
      SET 
        fc_username = ${neynarUser.username ?? null},
        fc_display_name = ${neynarUser.display_name ?? null},
        fc_pfp_url = ${neynarUser.pfp_url ?? null},
        fc_bio = ${neynarUser.profile?.bio?.text ?? null},
        fc_score = ${neynarUser.experimental?.neynar_user_score ?? null},
        fc_followers = ${neynarUser.follower_count ?? 0},
        fc_following = ${neynarUser.following_count ?? 0},
        fc_power_badge = ${neynarUser.power_badge ?? false},
        updated_at = NOW()
      WHERE fc_fid = ${current.fid}
    `;
    
    // Return fresh data
    const updated = await sql`
      SELECT fc_fid, fc_username, fc_display_name, fc_pfp_url, fc_bio,
             fc_followers, fc_following, fc_power_badge
      FROM users
      WHERE fc_fid = ${current.fid}
      LIMIT 1
    `;
    
    return NextResponse.json({
      success: true,
      neynarData: {
        fid: neynarUser.fid,
        username: neynarUser.username,
        display_name: neynarUser.display_name,
        pfp_url: neynarUser.pfp_url,
        follower_count: neynarUser.follower_count,
        following_count: neynarUser.following_count,
        power_badge: neynarUser.power_badge,
      },
      dbData: updated[0],
    });
  } catch (e: any) {
    console.error('[refresh] Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
