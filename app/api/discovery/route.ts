import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

function parseCreator(row: Record<string, unknown>) {
  return {
    ...row,
    niches: JSON.parse((row.niches as string) || '[]'),
    verified: Boolean(row.verified),
  };
}

export async function GET() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM tiktok_creators ORDER BY followers DESC').all() as Record<string, unknown>[];
  return NextResponse.json(rows.map(parseCreator));
}

export async function POST(req: Request) {
  const db = getDb();
  const body = await req.json();
  const stmt = db.prepare(`
    INSERT INTO tiktok_creators
      (name, handle, bio, location, age, gender, followers, avg_views, avg_likes, avg_comments,
       engagement_rate, niches, audience_age_18_24, audience_age_25_34, audience_female_pct,
       audience_uk_pct, audience_us_pct, rate_per_post, tiktok_url, verified)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);
  const result = stmt.run(
    body.name, body.handle, body.bio || '', body.location || 'UK',
    Number(body.age) || 0, body.gender || 'female',
    Number(body.followers) || 0, Number(body.avg_views) || 0,
    Number(body.avg_likes) || 0, Number(body.avg_comments) || 0,
    Number(body.engagement_rate) || 0,
    JSON.stringify(body.niches || []),
    Number(body.audience_age_18_24) || 0, Number(body.audience_age_25_34) || 0,
    Number(body.audience_female_pct) || 0, Number(body.audience_uk_pct) || 0,
    Number(body.audience_us_pct) || 0, Number(body.rate_per_post) || 0,
    body.tiktok_url || '', body.verified ? 1 : 0,
  );
  const created = db.prepare('SELECT * FROM tiktok_creators WHERE id = ?').get(result.lastInsertRowid) as Record<string, unknown>;
  return NextResponse.json(parseCreator(created), { status: 201 });
}
