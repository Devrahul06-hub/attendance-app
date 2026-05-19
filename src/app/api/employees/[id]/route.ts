import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Employee from '@/models/Employee';
import { getSession } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, employeeId, designation, district, assembly, phone, email, vendorName, salary, status, joinDate } = await req.json();

  await dbConnect();

  const trimmedId = employeeId?.trim() || undefined;
  if (trimmedId) {
    const conflict = await Employee.findOne({ employeeId: trimmedId, _id: { $ne: params.id } });
    if (conflict) return NextResponse.json({ error: 'Employee ID already exists' }, { status: 409 });
  }

  const employee = await Employee.findByIdAndUpdate(
    params.id,
    {
      name: name?.trim(),
      employeeId: trimmedId ?? null,
      designation: designation?.trim() || '',
      district: district?.trim() || '',
      assembly: assembly?.trim() || '',
      phone: phone?.trim() || '',
      email: email?.toLowerCase().trim() || '',
      vendorName: vendorName?.trim() || '',
      salary: salary?.trim() || '',
      status: status || 'active',
      joinDate: joinDate || '',
    },
    { new: true }
  );

  if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
  return NextResponse.json({ employee });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  await Employee.findByIdAndDelete(params.id);
  return NextResponse.json({ success: true });
}
