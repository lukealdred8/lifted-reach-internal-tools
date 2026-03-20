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
  // Email status fields from Instantly
  status?: string;          // lead status in campaign (e.g. 'active', 'completed', 'interested')
  is_replied?: boolean;
  is_bounced?: boolean;
  sent_count?: number;      // number of emails sent to this lead
  email_sent_at?: string;
  replied_at?: string;
}

function deriveEmailStatus(lead: InstantlyLead): {
  email_status: string;
  email_sent_at: string | null;
  replied_at: string | null;
} {
  if (lead.is_replied) {
    return {
      email_status: 'replied',
      email_sent_at: lead.email_sent_at ?? null,
      replied_at: lead.replied_at ?? null,
    };
  }
  if (lead.is_bounced) {
    return { email_status: 'bounced', email_sent_at: lead.email_sent_at ?? null, replied_at: null };
  }
  if ((lead.sent_count ?? 0) > 0 || (lead.status && lead.status !== 'active' && lead.status !== 'not_contacted')) {
    return { email_status: 'sent', email_sent_at: lead.email_sent_at ?? null, replied_at: null };
  }
  return { email_status: 'not_sent', email_sent_at: null, replied_at: null };
}

async function fetchAllLeads(apiKey: string): Promise<InstantlyLead[]> {
  let leads: InstantlyLead[] = [];
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
      throw new Error(`Instantly API error: ${res.status} ${text}`);
    }

    const data = await res.json();
    const items: InstantlyLead[] = data.items ?? data.leads ?? data ?? [];
    leads = leads.concat(items);
    nextStartingAfter = data.next_starting_after ?? null;
  } while (nextStartingAfter);

  return leads;
}

export async function POST() {
  const apiKey = process.env.INSTANTLY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'INSTANTLY_API_KEY not set' }, { status: 500 });
  }

  let instantly_leads: InstantlyLead[];
  try {
    instantly_leads = await fetchAllLeads(apiKey);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }

  const db = getDb();
  const creators = db.prepare('SELECT * FROM creators').all() as Creator[];

  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const lead of instantly_leads) {
    const email = lead.email?.trim().toLowerCase();
    if (!email) { skipped++; continue; }

    const emailStatus = deriveEmailStatus(lead);

    // Check if lead already exists (by email or by instantly_lead_id)
    const existing = db.prepare(
      'SELECT id FROM leads WHERE contact_email = ? OR instantly_lead_id = ?'
    ).get(email, lead.id) as { id: number } | undefined;

    if (existing) {
      // Update email status for existing lead
      db.prepare(`
        UPDATE leads
        SET email_status = ?,
            email_sent_at = COALESCE(?, email_sent_at),
            replied_at = COALESCE(?, replied_at),
            instantly_lead_id = COALESCE(instantly_lead_id, ?),
            updated_at = datetime('now')
        WHERE id = ?
      `).run(
        emailStatus.email_status,
        emailStatus.email_sent_at,
        emailStatus.replied_at,
        lead.id,
        existing.id,
      );
      updated++;
      continue;
    }

    // New lead — import and score
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
      INSERT INTO leads (
        brand_name, website, contact_name, contact_email, country, platform, notes,
        score, score_breakdown, estimated_deal_size, close_probability, expected_value,
        pricing_tiers, creator_matches,
        instantly_lead_id, email_status, email_sent_at, replied_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      lead.id,
      emailStatus.email_status,
      emailStatus.email_sent_at,
      emailStatus.replied_at,
    );

    imported++;
  }

  return NextResponse.json({ imported, updated, skipped, total: instantly_leads.length });
}
