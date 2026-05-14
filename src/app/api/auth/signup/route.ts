import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';
import { signToken, AUTH_COOKIE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be 6+ characters' }, { status: 400 });
    }

    await dbConnect();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const isFirstUser = (await User.countDocuments()) === 0;
    const role =
      isFirstUser || email.toLowerCase() === (process.env.ADMIN_EMAIL || '').toLowerCase()
        ? 'admin'
        : 'employee';

    const user = await User.create({ name, email: email.toLowerCase(), passwordHash, role });

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const res = NextResponse.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
    res.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (err: any) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 });
  }
}
