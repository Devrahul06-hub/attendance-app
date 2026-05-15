import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admins only' }, { status: 403 });

  const { name, email, password } = await req.json();

  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be 6+ characters' }, { status: 400 });
  }

  await dbConnect();

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name: name.trim(), email: email.toLowerCase(), passwordHash, role: 'employee' });

  return NextResponse.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
}
