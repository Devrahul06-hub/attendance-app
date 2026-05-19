import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admins only' }, { status: 403 });

  const { name, employeeId, designation, phone, email, salary, status, joinDate } = await req.json();

  await dbConnect();

  const user = await User.findByIdAndUpdate(
    params.id,
    {
      name: name?.trim(),
      employeeId: employeeId?.trim() || '',
      designation: designation?.trim() || '',
      phone: phone?.trim() || '',
      salary: salary?.trim() || '',
      email: email?.toLowerCase().trim(),
      status: status || 'active',
      joinDate: joinDate || '',
    },
    { new: true, select: '-passwordHash' }
  );

  if (!user) return NextResponse.json({ error: 'HR not found' }, { status: 404 });
  return NextResponse.json({ user });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admins only' }, { status: 403 });

  await dbConnect();
  await User.findByIdAndDelete(params.id);
  return NextResponse.json({ success: true });
}
