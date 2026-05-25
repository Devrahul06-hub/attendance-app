import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { dbConnect } from '@/lib/db';
import Employee from '@/models/Employee';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admins only' }, { status: 403 });

  const url = new URL(req.url);
  const hrId = url.searchParams.get('hrId');

  const query: any = { deleted: { $ne: true } };
  if (hrId) query.addedByHrId = hrId;

  await dbConnect();
  const employees = await Employee.find(query).sort({ createdAt: -1 }).lean() as any[];

  const rows = employees.map((e, i) => ({
    'Sr No': i + 1,
    'Emp ID': e.employeeId || '',
    'Emp Name': e.name,
    'Vendor Name': e.vendorName || '',
    'Designation': e.designation || '',
    'District': e.district || '',
    'Assembly': e.assembly || '',
    'Phone': e.phone || '',
    'Email': e.email || '',
    'Salary': e.salary || '',
    'Status': e.status === 'active' ? 'Active' : e.status === 'training' ? 'Training in process' : 'Back-out',
    'Join Date': e.joinDate || '',
    'Added by (HR)': e.addedByHrName || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 6 }, { wch: 10 }, { wch: 22 }, { wch: 20 }, { wch: 18 },
    { wch: 14 }, { wch: 22 }, { wch: 13 }, { wch: 24 }, { wch: 10 },
    { wch: 10 }, { wch: 12 }, { wch: 20 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');
  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="employees-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
