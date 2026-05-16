import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { dbConnect } from '@/lib/db';
import Attendance from '@/models/Attendance';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { phones } = await req.json();
  if (!phones?.length) return NextResponse.json({ error: 'No employees selected' }, { status: 400 });

  await dbConnect();

  const records = await Attendance.find({ phone: { $in: phones } })
    .sort({ date: 1 })
    .lean() as any[];

  if (!records.length) return NextResponse.json({ error: 'No attendance records found for selected employees' }, { status: 404 });

  // Group records by "Month Year" e.g. "May 2026"
  const monthMap: Record<string, any[]> = {};
  for (const r of records) {
    const [year, month] = r.date.split('-');
    const label = new Date(Number(year), Number(month) - 1, 1)
      .toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    if (!monthMap[label]) monthMap[label] = [];
    monthMap[label].push(r);
  }

  const workbook = XLSX.utils.book_new();

  // Sort months chronologically
  const sortedMonths = Object.keys(monthMap).sort((a, b) => {
    const da = new Date(a);
    const db = new Date(b);
    return da.getTime() - db.getTime();
  });

  for (const monthLabel of sortedMonths) {
    const rows = monthMap[monthLabel].map((r: any, i: number) => ({
      'Sr No': i + 1,
      'Employee Name': r.employeeName,
      'Phone': r.phone,
      'Date': r.date,
      'Status': r.status === 'half-day' ? 'Half Day' : r.status.charAt(0).toUpperCase() + r.status.slice(1),
      'IN Time': r.inTime || '',
      'OUT Time': r.outTime || '',
      'Remarks': r.remarks || '',
      'Marked By (HR)': r.markedByHrName || '',
    }));

    const sheet = XLSX.utils.json_to_sheet(rows);
    sheet['!cols'] = [
      { wch: 6 }, { wch: 22 }, { wch: 13 }, { wch: 12 },
      { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 30 }, { wch: 20 },
    ];

    // Sheet name max 31 chars for Excel
    const sheetName = monthLabel.slice(0, 31);
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  }

  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="attendance-export-${Date.now()}.xlsx"`,
    },
  });
}
