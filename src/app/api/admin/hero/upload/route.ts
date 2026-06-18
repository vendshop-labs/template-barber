import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken, getAdminSecret, ADMIN_COOKIE } from '@/lib/adminAuth';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

async function checkAdmin(): Promise<boolean> {
  const c = await cookies();
  const token = c.get(ADMIN_COOKIE)?.value;
  return verifyAdminToken(token, getAdminSecret());
}

export async function POST(req: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Nepodporovaný formát. Použite JPEG, PNG, WebP, GIF alebo AVIF.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Súbor je príliš veľký (max. 10MB)' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const processed = await sharp(buffer)
    .resize(1920, 1080, { fit: 'cover', position: 'center' })
    .webp({ quality: 85 })
    .toBuffer();

  const filename = `hero-${Date.now()}.webp`;
  const STORE_SLUG = process.env.STORE_SLUG ?? 'kate-barber';

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob');
    const blob = await put(`hero/${STORE_SLUG}/${filename}`, processed, {
      access: 'public',
      contentType: 'image/webp',
    });
    return NextResponse.json({ url: blob.url });
  }

  // Local fallback
  const dir = path.join(process.cwd(), 'public', 'uploads', 'hero', STORE_SLUG);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), processed);
  return NextResponse.json({ url: `/uploads/hero/${STORE_SLUG}/${filename}` });
}
