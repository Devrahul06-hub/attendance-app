import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Employee from '@/models/Employee';
import Attendance from '@/models/Attendance';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, employeeId, designation, district, assembly, phone, email, vendorName, salary, status, joinDate, assignToHrId } = await req.json();

  await dbConnect();

  const trimmedId = employeeId?.trim() || undefined;
  if (trimmedId) {
    const conflict = await Employee.findOne({ employeeId: trimmedId, _id: { $ne: params.id } });
    if (conflict) return NextResponse.json({ error: 'Employee ID already exists' }, { status: 409 });
  }

  const setFields: any = {
    name: name?.trim(),
    designation: designation?.trim() || '',
    district: district?.trim() || '',
    assembly: assembly?.trim() || '',
    phone: phone?.trim() || '',
    email: email?.toLowerCase().trim() || '',
    vendorName: vendorName?.trim() || '',
    salary: salary?.trim() || '',
    status: status || 'active',
    joinDate: joinDate || '',
  };
  if (trimmedId) setFields.employeeId = trimmedId;

  if (session.role === 'admin' && assignToHrId) {
    const hr = await User.findById(assignToHrId).lean() as any;
    if (!hr) return NextResponse.json({ error: 'Selected HR not found' }, { status: 404 });
    setFields.addedByHrId = String(hr._id);
    setFields.addedByHrName = hr.name;
  }

  const updateOp: any = { $set: setFields };
  if (!trimmedId) updateOp.$unset = { employeeId: '' };

  const employee = await Employee.findByIdAndUpdate(params.id, updateOp, { new: true });

  if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
  return NextResponse.json({ employee });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admins only' }, { status: 403 });

  await dbConnect();
  const emp = await Employee.findById(params.id).lean() as any;
  await Employee.findByIdAndUpdate(params.id, { deleted: true });
  if (emp?.phone) {
    await Attendance.updateMany({ phone: emp.phone }, { deleted: true });
  }
  return NextResponse.json({ success: true });
}
