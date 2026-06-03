import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { dbConnect } from '@/lib/db';
import Attendance from '@/models/Attendance';
import Employee from '@/models/Employee';
import { getSession } from '@/lib/auth';

function getDatesInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const s = new Date(start + 'T00:00:00Z');
  const e = new Date(end + 'T00:00:00Z');
  for (let d = new Date(s); d <= e; d.setUTCDate(d.getUTCDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const day = dayNames[d.getUTCDay()];
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${day}\n${dd}-${mm}`;
}

function statusCode(status?: string): string {
  if (!status || status === 'not-selected') return '-';
  if (status === 'present') return '1P';
  if (status === 'half-day') return '1H';
  if (status === 'absent') return 'A';
  if (status === 'paid-leave') return 'WO';
  return '-';
}

function statusLabel(status?: string): string {
  if (!status || status === 'not-selected') return 'Unmarked';
  if (status === 'present') return 'Present';
  if (status === 'half-day') return 'Half Day';
  if (status === 'absent') return 'Absent';
  if (status === 'paid-leave') return 'Weekly Off';
  return 'Unmarked';
}

function calcWorkHours(inTime?: string, outTime?: string): string {
  if (!inTime || !outTime) return '-';
  const [inH, inM] = inTime.split(':').map(Number);
  const [outH, outM] = outTime.split(':').map(Number);
  let mins = (outH * 60 + outM) - (inH * 60 + inM);
  if (mins < 0) mins += 24 * 60;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function addWorkHours(times: string[]): string {
  let totalMins = 0;
  for (const t of times) {
    if (!t || t === '-') continue;
    const [h, m] = t.split(':').map(Number);
    totalMins += h * 60 + m;
  }
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatTimeAmPm(time?: string): string {
  if (!time) return '-';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

export async function GET(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admins only' }, { status: 403 });

  const url = new URL(req.url);
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
  }

  await dbConnect();

  const [employees, records] = await Promise.all([
    Employee.find({ deleted: { $ne: true } }).sort({ createdAt: 1 }).lean() as Promise<any[]>,
    Attendance.find({
      deleted: { $ne: true },
      date: { $gte: startDate, $lte: endDate },
    }).lean() as Promise<any[]>,
  ]);

  const dates = getDatesInRange(startDate, endDate);

  // attendance lookup: phone -> date -> record
  const attMap: Record<string, Record<string, any>> = {};
  for (const rec of records) {
    if (!attMap[rec.phone]) attMap[rec.phone] = {};
    attMap[rec.phone][rec.date] = rec;
  }

  const workbook = XLSX.utils.book_new();

  // ===== SHEET 1: Muster Roll =====
  const sheet1Rows: any[][] = [];

  const empBlank = ['', '', '', '', '', '', '', '', '', '', ''];

  const header1 = [
    'S.N.', 'Staff Name',
    'Employee ID', 'Designation', 'District', 'Assembly', 'Phone', 'Email', 'Vendor Name', 'Salary', 'Status', 'Join Date', 'Added By HR',
    'Days  ➡️',
    ...dates.map(dayLabel),
    'Total \nHours', 'Total \nPresent', 'Total \nAbsent',
    'Total \nHalf \nDays', 'Total \nWeekly \nOff', 'Total \nUnmarked',
    'Total \nOvertime \nHours', 'Total \nFine \nHours',
  ];
  sheet1Rows.push(header1);

  employees.forEach((emp, i) => {
    const phoneMap = attMap[emp.phone] || {};

    const statuses = dates.map((d) => statusCode(phoneMap[d]?.status));
    const inTimes = dates.map((d) => phoneMap[d]?.inTime || '-');
    const outTimes = dates.map((d) => phoneMap[d]?.outTime || '-');
    const workHrs = dates.map((d) => calcWorkHours(phoneMap[d]?.inTime, phoneMap[d]?.outTime));

    const totalPresent = dates.filter((d) => phoneMap[d]?.status === 'present').length;
    const totalAbsent = dates.filter((d) => phoneMap[d]?.status === 'absent').length;
    const totalHalfDay = dates.filter((d) => phoneMap[d]?.status === 'half-day').length;
    const totalPaidLeave = dates.filter((d) => phoneMap[d]?.status === 'paid-leave').length;
    const totalUnmarked = dates.filter((d) => !phoneMap[d] || phoneMap[d]?.status === 'not-selected').length;
    const totalWorkHrs = addWorkHours(workHrs);

    const empFields = [
      emp.employeeId || '', emp.designation || '', emp.district || '', emp.assembly || '',
      emp.phone || '', emp.email || '', emp.vendorName || '', emp.salary || '',
      emp.status || '', emp.joinDate || '', emp.addedByHrName || '',
    ];

    sheet1Rows.push([i + 1, emp.name, ...empFields, 'Attendance State', ...statuses, '', totalPresent, totalAbsent, totalHalfDay, totalPaidLeave, totalUnmarked, '00:00', '00:00']);
    sheet1Rows.push(['', '', ...empBlank, 'IN', ...inTimes, '', '', '', '', '', '', '', '']);
    sheet1Rows.push(['', '', ...empBlank, 'OUT', ...outTimes, '', '', '', '', '', '', '', '']);
    sheet1Rows.push(['', '', ...empBlank, 'WH', ...workHrs, totalWorkHrs, '', '', '', '', '', '', '']);
    sheet1Rows.push(['', '', ...empBlank, 'OT', ...dates.map(() => '-'), '', '00:00', '', '', '', '', '', '']);
    sheet1Rows.push(['', '', ...empBlank, 'F', ...dates.map(() => '-'), '', '00:00', '', '', '', '', '', '']);
  });

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Rows);
  ws1['!cols'] = [
    { wch: 5 }, { wch: 22 },
    { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 18 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 18 },
    { wch: 18 },
    ...dates.map(() => ({ wch: 8 })),
    { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(workbook, ws1, 'Muster Roll');

  // ===== SHEET 2: Daily Attendance Report =====
  const sheet2Rows: any[][] = [];
  sheet2Rows.push(['S.N.', 'Date', 'Staff Name', 'Shift', 'Attendance', 'In Time', 'Out Time', 'Overtime (Hr)', 'Fine (Hr)']);

  let sn = 1;
  for (const date of dates) {
    for (const emp of employees) {
      const rec = attMap[emp.phone]?.[date];
      if (rec) {
        sheet2Rows.push([
          sn++,
          date,
          emp.name,
          '-',
          statusLabel(rec.status),
          formatTimeAmPm(rec.inTime),
          formatTimeAmPm(rec.outTime),
          '00:00 Hrs',
          '00:00 Hrs',
        ]);
      }
    }
  }

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Rows);
  ws2['!cols'] = [
    { wch: 5 }, { wch: 12 }, { wch: 22 }, { wch: 8 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(workbook, ws2, 'Daily Report');

  // ===== SHEET 3: Staff Muster Roll =====
  const sheet3Rows: any[][] = [];

  employees.forEach((emp, empIdx) => {
    if (empIdx > 0) {
      sheet3Rows.push(['', '', '', '', '', '', '']);
    }
    const phoneMap = attMap[emp.phone] || {};

    sheet3Rows.push([`Staff Name: ${emp.name}, \nReport Start Date : ${startDate},  \nReport End Date : ${endDate},  `, '', '', '', '', '', '']);
    sheet3Rows.push(['', '', '', '', '', '', '']);
    sheet3Rows.push(['', '', '', '', '', '', '']);
    sheet3Rows.push(['Date', 'Attendance State', 'In Time', 'Out Time', 'Work Hours', 'Overtime Hours', 'Fine Hours']);

    for (const date of dates) {
      const rec = phoneMap[date];
      sheet3Rows.push([
        date,
        statusCode(rec?.status),
        rec?.inTime || '-',
        rec?.outTime || '-',
        calcWorkHours(rec?.inTime, rec?.outTime),
        '-',
        '-',
      ]);
    }
  });

  const ws3 = XLSX.utils.aoa_to_sheet(sheet3Rows);
  ws3['!cols'] = [
    { wch: 42 }, { wch: 16 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 16 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(workbook, ws3, 'Staff Report');

  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  const filename = `attendance-report-${startDate}-to-${endDate}.xlsx`;

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
