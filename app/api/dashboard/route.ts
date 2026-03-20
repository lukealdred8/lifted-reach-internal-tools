import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();

  const all = db.prepare('SELECT * FROM leads').all() as Record<string, number | string>[];
  const active = all.filter(l => !['Lost', 'Closed'].includes(l.status as string));
  const closed = all.filter(l => l.status === 'Closed');
  const lost = all.filter(l => l.status === 'Lost');

  const totalPipeline = active.reduce((s, l) => s + (l.estimated_deal_size as number), 0);
  const totalExpected = active.reduce((s, l) => s + (l.expected_value as number), 0);
  const totalClosed = closed.reduce((s, l) => s + (l.estimated_deal_size as number), 0);

  const qualified = [...closed, ...lost];
  const closeRate = qualified.length > 0 ? Math.round((closed.length / qualified.length) * 100) : 0;

  const allDeals = all.filter(l => (l.estimated_deal_size as number) > 0);
  const avgDealSize = allDeals.length > 0
    ? Math.round(allDeals.reduce((s, l) => s + (l.estimated_deal_size as number), 0) / allDeals.length)
    : 0;

  const byStatus = {
    Lead: all.filter(l => l.status === 'Lead').length,
    Contacted: all.filter(l => l.status === 'Contacted').length,
    Replied: all.filter(l => l.status === 'Replied').length,
    Negotiating: all.filter(l => l.status === 'Negotiating').length,
    Closed: closed.length,
    Lost: lost.length,
  };

  return NextResponse.json({
    total_leads: all.length,
    active_deals: active.length,
    total_pipeline: totalPipeline,
    expected_revenue: totalExpected,
    closed_revenue: totalClosed,
    close_rate: closeRate,
    avg_deal_size: avgDealSize,
    by_status: byStatus,
  });
}
