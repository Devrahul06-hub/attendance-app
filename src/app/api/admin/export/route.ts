import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { dbConnect } from '@/lib/db';
import Attendance from '@/models/Attendance';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const date = url.searchParams.get('date');

  const query: any = {};
  if (session.role === 'admin') {
    const hrId = url.searchParams.get('hrId');
    if (hrId) query.markedByHrId = hrId;
  } else {
    query.markedByHrId = session.userId;
  }
  if (date) query.date = date;

  await dbConnect();
  const records = await Attendance.find(query).sort({ date: -1, time: -1 }).lean();

  const rows = records.map((r: any) => ({
    'Employee Name': r.employeeName,
    Project: r.project || '',
    Date: r.date,
    'IN Time': r.inTime || '',
    'OUT Time': r.outTime || '',
    Status: r.status,
    'HR Remarks': r.remarks || '',
    'Marked By (HR)': r.markedByHrName,
    'HR Email': r.markedByHrEmail,
    'IN Photo': (r.inPhoto || '').startsWith('data:') ? '(image)' : (r.inPhoto || '').slice(0, 500),
    'OUT Photo': (r.outPhoto || '').startsWith('data:') ? '(image)' : (r.outPhoto || '').slice(0, 500),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 22 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
    { wch: 30 }, { wch: 20 }, { wch: 28 }, { wch: 40 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="attendance-${Date.now()}.xlsx"`,
    },
  });
}
