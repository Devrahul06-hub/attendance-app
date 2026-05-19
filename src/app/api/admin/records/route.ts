import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Attendance from '@/models/Attendance';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admins only' }, { status: 403 });

  const url = new URL(req.url);
  const date = url.searchParams.get('date');
  const hrId = url.searchParams.get('hrId');
  const status = url.searchParams.get('status');
  const search = url.searchParams.get('search');

  const query: any = {};
  if (date) query.date = date;
  if (hrId) query.markedByHrId = hrId;
  if (status && ['present', 'absent', 'half-day', 'paid-leave', 'not-selected'].includes(status)) query.status = status;
  if (search) query.employeeName = { $regex: search, $options: 'i' };

  await dbConnect();
  const records = await Attendance.find(query)
    .sort({ date: -1, time: -1 })
    .limit(500)
    .lean();

  return NextResponse.json({ records });
}
