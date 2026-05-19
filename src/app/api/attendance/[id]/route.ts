import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Attendance from '@/models/Attendance';
import { getSession } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { employeeName, phone, project, date, inTime, outTime, status, remarks, inPhoto, outPhoto } = await req.json();

  if (!employeeName?.trim()) return NextResponse.json({ error: 'Employee name is required' }, { status: 400 });
  if (!phone?.trim()) return NextResponse.json({ error: 'Mobile number is required' }, { status: 400 });
  if (!['present', 'absent', 'half-day', 'not-selected', 'paid-leave'].includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

  await dbConnect();

  const filter = session.role === 'admin'
    ? { _id: params.id }
    : { _id: params.id, markedByHrId: session.userId };

  const existing = await Attendance.findOne(filter);
  if (!existing) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
  if (existing.status === 'absent') return NextResponse.json({ error: 'Absent records cannot be edited' }, { status: 403 });

  const record = await Attendance.findOneAndUpdate(
    filter,
    { employeeName: employeeName.trim(), phone: phone.trim(), project: project?.trim() || '', date, inTime, outTime, status, remarks, inPhoto, outPhoto },
    { new: true }
  );

  if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
  return NextResponse.json({ record });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();

  const filter = session.role === 'admin'
    ? { _id: params.id }
    : { _id: params.id, markedByHrId: session.userId };

  const record = await Attendance.findOneAndDelete(filter);
  if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

  return NextResponse.json({ ok: true });
}
