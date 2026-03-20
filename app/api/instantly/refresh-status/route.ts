/**
 * Lightweight endpoint: only refreshes email_status / replied_at for leads
 * that are already in our DB and linked to Instantly. Does not import new leads.
 * Called automatically by the UI every 5 minutes.
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const INSTANTLY_API = 'https://api.instantly.ai/api/v2';

interface InstantlyLead {
  id: string;
  email: string;
  status?: string;
  is_replied?: boolean;
  is_bounced?: boolean;
  sent_count?: number;
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

export async function POST() {
  const apiKey = process.env.INSTANTLY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'INSTANTLY_API_KEY not set' }, { status: 500 });
  }

  const db = getDb();

  // Only fetch leads we already have linked to Instantly
  const linkedLeads = db.prepare(
    "SELECT id, contact_email, instantly_lead_id FROM leads WHERE instantly_lead_id IS NOT NULL"
  ).all() as { id: number; contact_email: string; instantly_lead_id: string }[];

  if (linkedLeads.length === 0) {
    return NextResponse.json({ refreshed: 0, message: 'No linked leads to refresh' });
  }

  // Fetch each lead's current status from Instantly individually
  // (batch by pages if needed — for now fetch all and filter)
  let instantly_leads: InstantlyLead[] = [];
  let nextStartingAfter: string | null = null;

  do {
    const url = new URL(`${INSTANTLY_API}/leads`);
    url.searchParams.set('limit', '100');
    if (nextStartingAfter) url.searchParams.set('starting_after', nextStartingAfter);

    const res = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
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

  // Build lookup by Instantly lead ID
  const byId = new Map(instantly_leads.map(l => [l.id, l]));
  const byEmail = new Map(instantly_leads.map(l => [l.email?.trim().toLowerCase(), l]));

  let refreshed = 0;

  for (const local of linkedLeads) {
    const remote = byId.get(local.instantly_lead_id) ?? byEmail.get(local.contact_email?.toLowerCase());
    if (!remote) continue;

    const { email_status, email_sent_at, replied_at } = deriveEmailStatus(remote);

    db.prepare(`
      UPDATE leads
      SET email_status = ?,
          email_sent_at = COALESCE(?, email_sent_at),
          replied_at = COALESCE(?, replied_at),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(email_status, email_sent_at, replied_at, local.id);

    refreshed++;
  }

  return NextResponse.json({ refreshed });
}
