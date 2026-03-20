'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Lead {
  id: number;
  brand_name: string;
  country: string;
  platform: string;
  status: string;
  score: number;
  estimated_deal_size: number;
  close_probability: number;
  expected_value: number;
  contact_name: string;
  contact_email: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  Lead: 'bg-gray-100 text-gray-600',
  Contacted: 'bg-blue-100 text-blue-700',
  Replied: 'bg-yellow-100 text-yellow-700',
  Negotiating: 'bg-orange-100 text-orange-700',
  Closed: 'bg-green-100 text-green-700',
  Lost: 'bg-red-100 text-red-600',
};

const STATUSES = ['Lead', 'Contacted', 'Replied', 'Negotiating', 'Closed', 'Lost'];

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-green-100 text-green-700' : score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600';
  return <span className={`text-xs font-bold px-2 py-0.5 rounded ${color}`}>{score}</span>;
}

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  useEffect(() => {
    fetch('/api/leads').then(r => r.json()).then(d => { setLeads(d); setLoading(false); });
  }, []);

  async function syncInstantly() {
    setSyncing(true);
    setSyncMsg('');
    try {
      const res = await fetch('/api/instantly/sync', { method: 'POST' });
      const data = await res.json();
      if (data.error) {
        setSyncMsg(`Error: ${data.error}`);
      } else {
        setSyncMsg(`Synced! ${data.imported} new leads imported.`);
        fetch('/api/leads').then(r => r.json()).then(d => setLeads(d));
      }
    } catch {
      setSyncMsg('Sync failed — check your connection.');
    }
    setSyncing(false);
  }

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  }

  const filtered = filter === 'All' ? leads : leads.filter(l => l.status === filter);

  if (loading) return <div className="text-gray-400 text-sm mt-10 text-center">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <p className="text-sm text-gray-500 mt-0.5">{leads.length} leads total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={syncInstantly} disabled={syncing}
            className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50">
            {syncing ? 'Syncing...' : 'Sync Instantly'}
          </button>
          <Link href="/leads/new"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            + Add Lead
          </Link>
        </div>
      </div>
      {syncMsg && (
        <div className="mb-4 text-sm px-3 py-2 rounded-lg bg-green-50 text-green-700 border border-green-200">
          {syncMsg}
        </div>
      )}

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        {['All', ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`text-sm px-3 py-1 rounded-full border transition-colors ${
              filter === s ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}>
            {s} {s === 'All' ? `(${leads.length})` : `(${leads.filter(l => l.status === s).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No leads here.</p>
          <Link href="/leads/new" className="mt-2 inline-block text-indigo-600 text-sm font-medium hover:underline">Add one →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(lead => (
            <div key={lead.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-200 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/leads/${lead.id}`} className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
                      {lead.brand_name}
                    </Link>
                    <ScoreBadge score={lead.score} />
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[lead.status]}`}>
                      {lead.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 space-x-3">
                    {lead.contact_name && <span>{lead.contact_name}</span>}
                    {lead.country && <span>{lead.country}</span>}
                    {lead.platform && <span>{lead.platform}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-gray-900">£{lead.estimated_deal_size.toLocaleString('en-GB')}</p>
                  <p className="text-xs text-gray-400">{lead.close_probability}% close · £{lead.expected_value.toLocaleString('en-GB')} EV</p>
                </div>
              </div>

              {/* Quick status update */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {STATUSES.map(s => (
                  <button key={s} onClick={() => updateStatus(lead.id, s)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      lead.status === s
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}>
                    {s}
                  </button>
                ))}
                <Link href={`/leads/${lead.id}`}
                  className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 ml-auto">
                  View →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
