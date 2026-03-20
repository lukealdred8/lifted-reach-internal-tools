import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { scoreLead, calculateDealIntelligence, generatePricingTiers, matchCreators, Creator } from '@/lib/scoring';

const INSTANTLY_API = 'https://api.instantly.ai/api/v2';

interface InstantlyLead {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  website?: string;
  country?: string;
  custom_variables?: Record<string, string>;
}

export async function POST() {
  const apiKey = process.env.INSTANTLY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'INSTANTLY_API_KEY not set' }, { status: 500 });
  }

  // Fetch leads from Instantly
  let instantly_leads: InstantlyLead[] = [];
  let nextStartingAfter: string | null = null;

  do {
    const url = new URL(`${INSTANTLY_API}/leads`);
    url.searchParams.set('limit', '100');
    if (nextStartingAfter) url.searchParams.set('starting_after', nextStartingAfter);

    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Instantly API error: ${res.status} ${text}` }, { status: 502 });
    }

    const data = await res.json();
    const items: InstantlyLead[] = data.items ?? data.leads ?? data ?? [];
    instantly_leads = instantly_leads.concat(items);
    nextStartingAfter = data.next_starting_after ?? null;
  } while (nextStartingAfter);

  const db = getDb();
  const creators = db.prepare('SELECT * FROM creators').all() as Creator[];

  let imported = 0;
  let skipped = 0;

  for (const lead of instantly_leads) {
    const email = lead.email?.trim().toLowerCase();
    if (!email) { skipped++; continue; }

    // Skip if already imported
    const existing = db.prepare('SELECT id FROM leads WHERE contact_email = ?').get(email);
    if (existing) { skipped++; continue; }

    const brand_name = lead.company_name || email.split('@')[1]?.split('.')[0] || 'Unknown';
    const contact_name = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || '';
    const website = lead.website || '';
    const country = lead.country || 'UK';
    const platform = lead.custom_variables?.platform || 'Instagram';
    const notes = lead.custom_variables?.notes || '';

    const scoreResult = scoreLead({ brand_name, website, contact_name, contact_email: email, country, platform, notes });
    const deal = calculateDealIntelligence(scoreResult.total, platform, notes);
    const tiers = generatePricingTiers(scoreResult.total, platform);
    const matched = matchCreators(creators, platform, notes, scoreResult.brand_fit);

    db.prepare(`
      INSERT INTO leads (brand_name, website, contact_name, contact_email, country, platform, notes,
        score, score_breakdown, estimated_deal_size, close_probability, expected_value, pricing_tiers, creator_matches)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      brand_name, website, contact_name, email,
      country, platform, notes,
      scoreResult.total,
      JSON.stringify(scoreResult),
      deal.estimated_deal_size,
      deal.close_probability,
      deal.expected_value,
      JSON.stringify(tiers),
      JSON.stringify(matched),
    );

    imported++;
  }

  return NextResponse.json({ imported, skipped, total: instantly_leads.length });
}
