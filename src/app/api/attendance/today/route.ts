import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Attendance from '@/models/Attendance';
import { getSession } from '@/lib/auth';

function todayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const record = await Attendance.findOne({
    markedByHrId: session.userId,
    date: todayDateString(),
  }).lean();

  return NextResponse.json({ record });
}
