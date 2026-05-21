import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Vendor from '@/models/Vendor';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const vendors = await Vendor.find({}).sort({ name: 1 }).lean();
  return NextResponse.json({ vendors });
}

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admins only' }, { status: 403 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Vendor name is required' }, { status: 400 });

  await dbConnect();

  const existing = await Vendor.findOne({ name: { $regex: `^${name.trim()}$`, $options: 'i' } });
  if (existing) return NextResponse.json({ error: 'Vendor already exists' }, { status: 409 });

  const vendor = await Vendor.create({ name: name.trim() });
  return NextResponse.json({ vendor });
}
