import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { scoreLead, calculateDealIntelligence, generatePricingTiers, matchCreators, Creator } from '@/lib/scoring';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(lead);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const db = getDb();

  const existing = db.prepare('SELECT * FROM leads WHERE id = ?').get(id) as Record<string, unknown>;
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // If only updating status, do a simple update
  if (Object.keys(body).length === 1 && body.status) {
    db.prepare('UPDATE leads SET status = ?, updated_at = datetime("now") WHERE id = ?').run(body.status, id);
    return NextResponse.json(db.prepare('SELECT * FROM leads WHERE id = ?').get(id));
  }

  // Full update — re-score
  const merged = { ...existing, ...body };
  const { brand_name, website, contact_name, contact_email, country, platform, notes } = merged as Record<string, string>;

  const scoreResult = scoreLead({ brand_name, website, contact_name, contact_email, country, platform, notes });
  const deal = calculateDealIntelligence(scoreResult.total, platform || '', notes || '');
  const tiers = generatePricingTiers(scoreResult.total, platform || '');
  const creators = db.prepare('SELECT * FROM creators').all() as Creator[];
  const matched = matchCreators(creators, platform || '', notes || '', scoreResult.brand_fit);

  db.prepare(`
    UPDATE leads SET
      brand_name = ?, website = ?, contact_name = ?, contact_email = ?,
      country = ?, platform = ?, notes = ?, status = ?,
      score = ?, score_breakdown = ?, estimated_deal_size = ?,
      close_probability = ?, expected_value = ?, pricing_tiers = ?, creator_matches = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    brand_name, website || '', contact_name || '', contact_email || '',
    country || 'UK', platform || 'Instagram', notes || '',
    merged.status || 'Lead',
    scoreResult.total,
    JSON.stringify(scoreResult),
    deal.estimated_deal_size,
    deal.close_probability,
    deal.expected_value,
    JSON.stringify(tiers),
    JSON.stringify(matched),
    id,
  );

  return NextResponse.json(db.prepare('SELECT * FROM leads WHERE id = ?').get(id));
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM leads WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
