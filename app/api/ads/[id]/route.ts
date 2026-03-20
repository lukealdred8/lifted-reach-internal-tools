import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const ad = db.prepare('SELECT * FROM tiktok_ads WHERE id = ?').get(Number(id));
  if (!ad) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(ad);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const existing = db.prepare('SELECT * FROM tiktok_ads WHERE id = ?').get(Number(id));
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const textFields = ['title', 'brand_name', 'creator_name', 'tiktok_url', 'campaign_date', 'niche', 'notes'];
  const intFields = ['views', 'likes', 'comments', 'shares', 'saves', 'reach', 'impressions', 'profile_visits', 'follows', 'ad_spend', 'clicks'];

  const updates: string[] = [];
  const values: (string | number)[] = [];

  for (const f of textFields) {
    if (body[f] !== undefined) { updates.push(`${f} = ?`); values.push(String(body[f]).trim()); }
  }
  for (const f of intFields) {
    if (body[f] !== undefined) { updates.push(`${f} = ?`); values.push(parseInt(body[f]) || 0); }
  }

  if (updates.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  values.push(Number(id));
  db.prepare(`UPDATE tiktok_ads SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  return NextResponse.json(db.prepare('SELECT * FROM tiktok_ads WHERE id = ?').get(Number(id)));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const ad = db.prepare('SELECT * FROM tiktok_ads WHERE id = ?').get(Number(id)) as { video_filename?: string } | undefined;
  if (!ad) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (ad.video_filename) {
    const filepath = join(process.cwd(), 'public', 'uploads', 'ads', ad.video_filename);
    if (existsSync(filepath)) unlinkSync(filepath);
  }

  db.prepare('DELETE FROM tiktok_ads WHERE id = ?').run(Number(id));
  return NextResponse.json({ ok: true });
}
