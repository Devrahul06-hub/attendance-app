import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admins only' }, { status: 403 });

  await dbConnect();
  const users = await User.find({}, { passwordHash: 0 }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ users });
}
