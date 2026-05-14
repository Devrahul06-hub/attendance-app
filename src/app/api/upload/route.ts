import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { uploadToDrive } from '@/lib/drive';

const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPG and PNG are allowed' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Max file size is 5 MB' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${session.email}-${Date.now()}-${file.name}`;
    const result = await uploadToDrive(buffer, filename, file.type);

    return NextResponse.json({ imageUrl: result.webViewLink });
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: err?.message || 'Upload failed' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
