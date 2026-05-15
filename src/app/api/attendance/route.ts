import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Attendance from '@/models/Attendance';
import { getSession } from '@/lib/auth';

function todayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { employeeName, phone, project, date, inTime, outTime, status, remarks, inPhoto, outPhoto } = await req.json();

  if (!employeeName?.trim()) return NextResponse.json({ error: 'Employee name is required' }, { status: 400 });
  if (!phone?.trim()) return NextResponse.json({ error: 'Mobile number is required' }, { status: 400 });
  if (!['present', 'absent', 'half-day'].includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

  const attendanceDate = date || todayDateString();

  await dbConnect();

  const duplicate = await Attendance.findOne({ phone: phone.trim(), date: attendanceDate });
  if (duplicate) {
    return NextResponse.json(
      { error: `Attendance already marked for this employee on ${attendanceDate}` },
      { status: 409 }
    );
  }

  const record = await Attendance.create({
    employeeName: employeeName.trim(),
    phone: phone.trim(),
    project: project?.trim() || '',
    date: attendanceDate,
    inTime: inTime || '',
    outTime: outTime || '',
    status,
    remarks: remarks || '',
    inPhoto: inPhoto || undefined,
    outPhoto: outPhoto || undefined,
    markedByHrId: session.userId,
    markedByHrName: session.name,
    markedByHrEmail: session.email,
  });

  return NextResponse.json({ record });
}

export async function GET(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const date = url.searchParams.get('date');
  const project = url.searchParams.get('project');
  const status = url.searchParams.get('status');
  const search = url.searchParams.get('search');

  const query: any = { markedByHrId: session.userId };
  if (date) query.date = date;
  if (project) query.project = { $regex: project, $options: 'i' };
  if (status && status !== 'all') query.status = status;
  if (search) query.employeeName = { $regex: search, $options: 'i' };

  await dbConnect();
  const records = await Attendance.find(query).sort({ date: -1, createdAt: -1 }).limit(500).lean();

  return NextResponse.json({ records });
}
