import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const creators = db.prepare('SELECT * FROM creators ORDER BY name ASC').all();
  return NextResponse.json(creators);
}

export async function POST(req: Request) {
  const { name, handle, platform, niche, followers, avg_views, rate_per_post, audience_uk_pct } = await req.json();
  if (!name || !handle || !platform || !niche) {
    return NextResponse.json({ error: 'name, handle, platform, and niche are required' }, { status: 400 });
  }
  const db = getDb();
  const result = db.prepare(
    `INSERT INTO creators (name, handle, platform, niche, followers, avg_views, rate_per_post, audience_uk_pct)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    name.trim(),
    handle.trim(),
    platform,
    niche,
    Number(followers) || 0,
    Number(avg_views) || 0,
    Number(rate_per_post) || 0,
    Number(audience_uk_pct) || 70,
  );
  const creator = db.prepare('SELECT * FROM creators WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(creator, { status: 201 });
}
