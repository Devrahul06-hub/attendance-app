import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Attendance from '@/models/Attendance';
import { getSession } from '@/lib/auth';

function todayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function timeString() {
  return new Date().toTimeString().slice(0, 8);
}

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { employeeName, status, remarks, imageUrl } = await req.json();

  if (!employeeName?.trim()) {
    return NextResponse.json({ error: 'Employee name is required' }, { status: 400 });
  }
  if (!['present', 'absent'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  await dbConnect();

  const record = await Attendance.create({
    employeeName: employeeName.trim(),
    date: todayDateString(),
    time: timeString(),
    status,
    remarks: remarks || '',
    imageUrl: imageUrl || undefined,
    markedByHrId: session.userId,
    markedByHrName: session.name,
    markedByHrEmail: session.email,
  });

  return NextResponse.json({ record });
}

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const records = await Attendance.find({ markedByHrId: session.userId })
    .sort({ date: -1, time: -1 })
    .limit(200)
    .lean();

  return NextResponse.json({ records });
}
