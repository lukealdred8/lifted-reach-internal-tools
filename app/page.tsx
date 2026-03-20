'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DashboardData {
  total_leads: number;
  active_deals: number;
  total_pipeline: number;
  expected_revenue: number;
  closed_revenue: number;
  close_rate: number;
  avg_deal_size: number;
  by_status: Record<string, number>;
}

function fmt(n: number) {
  return '£' + n.toLocaleString('en-GB');
}

const STATUS_ORDER = ['Lead', 'Contacted', 'Replied', 'Negotiating', 'Closed', 'Lost'];
const STATUS_COLORS: Record<string, string> = {
  Lead: 'bg-gray-100 text-gray-700',
  Contacted: 'bg-blue-100 text-blue-700',
  Replied: 'bg-yellow-100 text-yellow-700',
  Negotiating: 'bg-orange-100 text-orange-700',
  Closed: 'bg-green-100 text-green-700',
  Lost: 'bg-red-100 text-red-600',
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setData);
  }, []);

  if (!data) return <div className="text-gray-400 text-sm mt-10 text-center">Loading...</div>;

  const stats = [
    { label: 'Pipeline Value', value: fmt(data.total_pipeline), sub: 'Active deals total' },
    { label: 'Expected Revenue', value: fmt(data.expected_revenue), sub: 'Probability-weighted' },
    { label: 'Closed Revenue', value: fmt(data.closed_revenue), sub: 'Confirmed wins' },
    { label: 'Close Rate', value: `${data.close_rate}%`, sub: 'Closed vs lost' },
    { label: 'Avg Deal Size', value: fmt(data.avg_deal_size), sub: 'All leads' },
    { label: 'Active Deals', value: String(data.active_deals), sub: 'In pipeline' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pipeline overview</p>
        </div>
        <Link href="/leads/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          + Add Lead
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Pipeline funnel */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Pipeline Breakdown</h2>
        <div className="flex flex-wrap gap-3">
          {STATUS_ORDER.map(status => (
            <div key={status} className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[status]}`}>
                {status}
              </span>
              <span className="text-lg font-bold">{data.by_status[status] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {data.total_leads === 0 && (
        <div className="mt-8 text-center py-12 text-gray-400">
          <p className="text-lg">No leads yet.</p>
          <Link href="/leads/new" className="mt-3 inline-block text-indigo-600 font-medium text-sm hover:underline">
            Add your first lead →
          </Link>
        </div>
      )}
    </div>
  );
}
