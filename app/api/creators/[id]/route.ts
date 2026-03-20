import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const db = getDb();
  const existing = db.prepare('SELECT * FROM creators WHERE id = ?').get(Number(id));
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const fields = ['name', 'handle', 'platform', 'niche', 'followers', 'avg_views', 'rate_per_post', 'audience_uk_pct'];
  const updates: string[] = [];
  const values: (string | number)[] = [];

  for (const field of fields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(['followers', 'avg_views', 'rate_per_post', 'audience_uk_pct'].includes(field)
        ? Number(body[field])
        : String(body[field]).trim());
    }
  }

  if (updates.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  values.push(Number(id));
  db.prepare(`UPDATE creators SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  const updated = db.prepare('SELECT * FROM creators WHERE id = ?').get(Number(id));
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const existing = db.prepare('SELECT * FROM creators WHERE id = ?').get(Number(id));
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  db.prepare('DELETE FROM creators WHERE id = ?').run(Number(id));
  return NextResponse.json({ ok: true });
}
