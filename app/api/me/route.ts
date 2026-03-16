import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireCurrentUser, getFullUser } from '@/lib/auth';

export async function GET() {
  const current = await requireCurrentUser();
  const user = await getFullUser(current.fid);
  return NextResponse.json({ user });
}
