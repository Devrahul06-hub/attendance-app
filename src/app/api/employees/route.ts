import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Employee from '@/models/Employee';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, employeeId, designation, district, assembly, phone, email, vendorName, salary, status, joinDate, assignToHrId } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Employee name is required' }, { status: 400 });
  }
  if (!phone?.trim()) {
    return NextResponse.json({ error: 'Mobile number is required' }, { status: 400 });
  }
  if (!vendorName?.trim()) {
    return NextResponse.json({ error: 'Vendor name is required' }, { status: 400 });
  }

  await dbConnect();

  const trimmedId = employeeId?.trim() || undefined;
  if (trimmedId) {
    const existing = await Employee.findOne({ employeeId: trimmedId });
    if (existing) return NextResponse.json({ error: 'Employee ID already exists' }, { status: 409 });
  }

  const dupPhone = await Employee.findOne({ phone: phone.trim() });
  if (dupPhone) return NextResponse.json({ error: `Employee with phone ${phone.trim()} already exists` }, { status: 409 });

  let hrId = session.userId;
  let hrName = session.name;

  if (session.role === 'admin' && assignToHrId) {
    const hr = await User.findById(assignToHrId).lean() as any;
    if (!hr) return NextResponse.json({ error: 'Selected HR not found' }, { status: 404 });
    hrId = String(hr._id);
    hrName = hr.name;
  }

  const employee = await Employee.create({
    name: name.trim(),
    ...(trimmedId && { employeeId: trimmedId }),
    designation: designation?.trim() || '',
    district: district?.trim() || '',
    assembly: assembly?.trim() || '',
    phone: phone?.trim() || '',
    email: email?.toLowerCase().trim() || '',
    vendorName: vendorName.trim(),
    salary: salary?.trim() || '',
    status: status || 'active',
    joinDate: joinDate || '',
    addedByHrId: hrId,
    addedByHrName: hrName,
  });

  return NextResponse.json({ employee });
}

export async function GET(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const url = new URL(req.url);
  const hrId = url.searchParams.get('hrId');

  let query: any = session.role === 'employee' ? { addedByHrId: session.userId } : {};
  if (session.role === 'admin' && hrId) {
    query.addedByHrId = hrId;
  }

  const employees = await Employee.find(query).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ employees });
}
