import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import { getSession } from '@/lib/auth';

function todayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admins only' }, { status: 403 });

  await dbConnect();
  const date = todayDateString();

  const [totalUsers, presentToday, absentToday, totalRecords] = await Promise.all([
    User.countDocuments({ role: 'employee' }),
    Attendance.countDocuments({ date, status: 'present' }),
    Attendance.countDocuments({ date, status: 'absent' }),
    Attendance.countDocuments({}),
  ]);

  return NextResponse.json({ totalUsers, presentToday, absentToday, totalRecords, todayDate: date });
}
