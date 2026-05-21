import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Attendance from '@/models/Attendance';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const phone = url.searchParams.get('phone');
  const month = url.searchParams.get('month'); // YYYY-MM

  if (!phone) return NextResponse.json({ error: 'Phone required' }, { status: 400 });

  await dbConnect();

  const query: any = { phone, deleted: { $ne: true } };
  if (month) {
    query.date = { $regex: `^${month}` };
  }

  const records = await Attendance.find(query).sort({ date: 1 }).lean();
  return NextResponse.json({ records });
}
