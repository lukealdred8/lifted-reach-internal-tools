import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { scoreLead, calculateDealIntelligence, generatePricingTiers, matchCreators, Creator } from '@/lib/scoring';

export async function GET() {
  const db = getDb();
  const leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = getDb();

  const { brand_name, website, contact_name, contact_email, country, platform, notes } = body;

  // Score the lead
  const scoreResult = scoreLead({ brand_name, website, contact_name, contact_email, country, platform, notes });
  const deal = calculateDealIntelligence(scoreResult.total, platform || '', notes || '');
  const tiers = generatePricingTiers(scoreResult.total, platform || '');
  const creators = db.prepare('SELECT * FROM creators').all() as Creator[];
  const matched = matchCreators(creators, platform || '', notes || '', scoreResult.brand_fit);

  const stmt = db.prepare(`
    INSERT INTO leads (brand_name, website, contact_name, contact_email, country, platform, notes,
      score, score_breakdown, estimated_deal_size, close_probability, expected_value, pricing_tiers, creator_matches)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    brand_name, website || '', contact_name || '', contact_email || '',
    country || 'UK', platform || 'Instagram', notes || '',
    scoreResult.total,
    JSON.stringify(scoreResult),
    deal.estimated_deal_size,
    deal.close_probability,
    deal.expected_value,
    JSON.stringify(tiers),
    JSON.stringify(matched),
  );

  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(lead, { status: 201 });
}
