import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admins only' }, { status: 403 });

  const { name, email, password, employeeId, designation, project, phone, status, joinDate } = await req.json();

  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
  }
  if (!phone?.trim()) {
    return NextResponse.json({ error: 'Mobile number is required' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be 6+ characters' }, { status: 400 });
  }

  await dbConnect();

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase(),
    passwordHash,
    role: 'employee',
    employeeId: employeeId?.trim() || '',
    designation: designation?.trim() || '',
    project: project?.trim() || '',
    phone: phone?.trim() || '',
    status: status || 'active',
    joinDate: joinDate || '',
  });

  return NextResponse.json({ user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
}

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admins only' }, { status: 403 });

  await dbConnect();
  const hrs = await User.find({ role: 'employee' }, { passwordHash: 0 }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ hrs });
}
