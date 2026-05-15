import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Employee from '@/models/Employee';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, employeeId, project, phone } = await req.json();

  if (!name?.trim() || !employeeId?.trim()) {
    return NextResponse.json({ error: 'Name and Employee ID are required' }, { status: 400 });
  }

  await dbConnect();

  const existing = await Employee.findOne({ employeeId: employeeId.trim() });
  if (existing) return NextResponse.json({ error: 'Employee ID already exists' }, { status: 409 });

  const employee = await Employee.create({
    name: name.trim(),
    employeeId: employeeId.trim(),
    project: project?.trim() || '',
    phone: phone?.trim() || '',
    addedByHrId: session.userId,
    addedByHrName: session.name,
  });

  return NextResponse.json({ employee });
}

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const employees = await Employee.find({}).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ employees });
}
