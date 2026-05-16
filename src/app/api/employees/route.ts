import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Employee from '@/models/Employee';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, employeeId, designation, district, taluka, phone, email, status, joinDate } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Employee name is required' }, { status: 400 });
  }
  if (!phone?.trim()) {
    return NextResponse.json({ error: 'Mobile number is required' }, { status: 400 });
  }

  await dbConnect();

  const trimmedId = employeeId?.trim() || undefined;
  if (trimmedId) {
    const existing = await Employee.findOne({ employeeId: trimmedId });
    if (existing) return NextResponse.json({ error: 'Employee ID already exists' }, { status: 409 });
  }

  const employee = await Employee.create({
    name: name.trim(),
    ...(trimmedId && { employeeId: trimmedId }),
    designation: designation?.trim() || '',
    district: district?.trim() || '',
    taluka: taluka?.trim() || '',
    phone: phone?.trim() || '',
    email: email?.toLowerCase().trim() || '',
    status: status || 'active',
    joinDate: joinDate || '',
    addedByHrId: session.userId,
    addedByHrName: session.name,
  });

  return NextResponse.json({ employee });
}

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const query = session.role === 'employee' ? { addedByHrId: session.userId } : {};
  const employees = await Employee.find(query).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ employees });
}
