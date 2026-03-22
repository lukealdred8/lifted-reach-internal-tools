import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

function parseCreator(row: Record<string, unknown>) {
  return {
    ...row,
    niches: JSON.parse((row.niches as string) || '[]'),
    verified: Boolean(row.verified),
  };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  const body = await req.json();
  db.prepare(`
    UPDATE tiktok_creators SET
      name=?, handle=?, bio=?, location=?, age=?, gender=?, followers=?, avg_views=?,
      avg_likes=?, avg_comments=?, engagement_rate=?, niches=?, audience_age_18_24=?,
      audience_age_25_34=?, audience_female_pct=?, audience_uk_pct=?, audience_us_pct=?,
      rate_per_post=?, tiktok_url=?, verified=?
    WHERE id=?
  `).run(
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
    Number(id),
  );
  const updated = db.prepare('SELECT * FROM tiktok_creators WHERE id = ?').get(Number(id)) as Record<string, unknown>;
  return NextResponse.json(parseCreator(updated));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  db.prepare('DELETE FROM tiktok_creators WHERE id = ?').run(Number(id));
  return NextResponse.json({ ok: true });
}
