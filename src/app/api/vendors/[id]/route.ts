import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Vendor from '@/models/Vendor';
import { getSession } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admins only' }, { status: 403 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Vendor name is required' }, { status: 400 });

  await dbConnect();

  const conflict = await Vendor.findOne({ name: { $regex: `^${name.trim()}$`, $options: 'i' }, _id: { $ne: params.id } });
  if (conflict) return NextResponse.json({ error: 'Vendor name already exists' }, { status: 409 });

  const vendor = await Vendor.findByIdAndUpdate(params.id, { name: name.trim() }, { new: true });
  if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
  return NextResponse.json({ vendor });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admins only' }, { status: 403 });

  await dbConnect();
  await Vendor.findByIdAndDelete(params.id);
  return NextResponse.json({ success: true });
}
