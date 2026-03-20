'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface ScoreBreakdown {
  uk_relevance: number;
  brand_fit: number;
  budget_level: number;
  social_presence: number;
  campaign_likelihood: number;
  total: number;
  reasons: string[];
}

interface PricingTier {
  name: string;
  label: string;
  creators: number;
  deliverables: string;
  price: number;
  profit: number;
  margin: number;
}

interface Creator {
  id: number;
  name: string;
  handle: string;
  platform: string;
  niche: string;
  followers: number;
  avg_views: number;
  rate_per_post: number;
  audience_uk_pct: number;
  match_score?: number;
}

interface Lead {
  id: number;
  brand_name: string;
  website: string;
  contact_name: string;
  contact_email: string;
  country: string;
  platform: string;
  notes: string;
  status: string;
  score: number;
  score_breakdown: string;
  estimated_deal_size: number;
  close_probability: number;
  expected_value: number;
  pricing_tiers: string;
  creator_matches: string;
  created_at: string;
}

const STATUSES = ['Lead', 'Contacted', 'Replied', 'Negotiating', 'Closed', 'Lost'];
const STATUS_COLORS: Record<string, string> = {
  Lead: 'bg-gray-100 text-gray-600',
  Contacted: 'bg-blue-100 text-blue-700',
  Replied: 'bg-yellow-100 text-yellow-700',
  Negotiating: 'bg-orange-100 text-orange-700',
  Closed: 'bg-green-100 text-green-700',
  Lost: 'bg-red-100 text-red-600',
};

function fmt(n: number) { return '£' + n.toLocaleString('en-GB'); }
function fmtNum(n: number) { return n >= 1000000 ? (n / 1000000).toFixed(1) + 'M' : n >= 1000 ? (n / 1000).toFixed(0) + 'k' : String(n); }

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  const color = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span>
        <span className="font-medium">{value}/{max}</span>
      </div>
      <div className="bg-gray-100 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function LeadDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/leads/${id}`).then(r => r.json()).then(setLead);
  }, [id]);

  async function updateStatus(status: string) {
    const res = await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const updated = await res.json();
    setLead(updated);
  }

  async function saveEdit() {
    setSaving(true);
    const res = await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    const updated = await res.json();
    setLead(updated);
    setEditing(false);
    setSaving(false);
  }

  async function deleteLead() {
    if (!confirm('Delete this lead?')) return;
    await fetch(`/api/leads/${id}`, { method: 'DELETE' });
    router.push('/leads');
  }

  if (!lead) return <div className="text-gray-400 text-sm mt-10 text-center">Loading...</div>;

  const score: ScoreBreakdown = JSON.parse(lead.score_breakdown || '{}');
  const tiers: PricingTier[] = JSON.parse(lead.pricing_tiers || '[]');
  const creators: Creator[] = JSON.parse(lead.creator_matches || '[]');

  const scoreColor = lead.score >= 70 ? 'text-green-600' : lead.score >= 50 ? 'text-yellow-600' : 'text-red-500';

  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Instagram + TikTok', 'Instagram + YouTube', 'All Platforms'];
  const COUNTRIES = ['UK', 'USA', 'EU', 'France', 'Germany', 'Italy', 'Spain', 'Australia', 'UAE', 'Other'];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/leads" className="text-sm text-gray-400 hover:text-gray-600">← Pipeline</Link>
          </div>
          <h1 className="text-2xl font-bold">{lead.brand_name}</h1>
          {lead.website && (
            <a href={lead.website} target="_blank" rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:underline">{lead.website}</a>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => { setEditing(true); setEditForm({ ...lead }); }}
            className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Edit
          </button>
          <button onClick={deleteLead}
            className="text-sm px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
            Delete
          </button>
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <h2 className="text-lg font-bold mb-4">Edit Lead</h2>
            <div className="space-y-3">
              {(['brand_name', 'website', 'contact_name', 'contact_email'] as const).map(f => (
                <div key={f}>
                  <label className="text-xs text-gray-500 block mb-1 capitalize">{f.replace('_', ' ')}</label>
                  <input type="text" value={(editForm[f] as string) || ''}
                    onChange={e => setEditForm(p => ({ ...p, [f]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Country</label>
                  <select value={editForm.country || ''} onChange={e => setEditForm(p => ({ ...p, country: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Platform</label>
                  <select value={editForm.platform || ''} onChange={e => setEditForm(p => ({ ...p, platform: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Notes</label>
                <textarea value={editForm.notes || ''} rows={3}
                  onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={saveEdit} disabled={saving}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : 'Save & Re-score'}
              </button>
              <button onClick={() => setEditing(false)}
                className="text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Status + quick info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLORS[lead.status]}`}>
                {lead.status}
              </span>
              <span className="text-xs text-gray-400">{lead.country} · {lead.platform}</span>
              {lead.contact_name && <span className="text-xs text-gray-500">{lead.contact_name}</span>}
              {lead.contact_email && (
                <a href={`mailto:${lead.contact_email}`} className="text-xs text-indigo-600 hover:underline">
                  {lead.contact_email}
                </a>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium mb-2">Move to:</p>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map(s => (
                  <button key={s} onClick={() => updateStatus(s)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      lead.status === s
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {lead.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 font-medium mb-1">Notes</p>
                <p className="text-sm text-gray-700 leading-relaxed">{lead.notes}</p>
              </div>
            )}
          </div>

          {/* Deal Intelligence */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Deal Intelligence</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{fmt(lead.estimated_deal_size)}</p>
                <p className="text-xs text-gray-400 mt-0.5">Estimated Deal</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">{lead.close_probability}%</p>
                <p className="text-xs text-gray-400 mt-0.5">Close Probability</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{fmt(lead.expected_value)}</p>
                <p className="text-xs text-gray-400 mt-0.5">Expected Value</p>
              </div>
            </div>
          </div>

          {/* Pricing Tiers */}
          {tiers.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Suggested Pricing</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {tiers.map((tier, i) => {
                  const highlight = i === 1;
                  return (
                    <div key={tier.name}
                      className={`rounded-xl p-4 border-2 ${highlight ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{tier.label}</span>
                        {highlight && <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">Recommended</span>}
                      </div>
                      <p className="text-2xl font-bold mb-1">{fmt(tier.price)}</p>
                      <p className="text-xs text-gray-500">{tier.creators} creator{tier.creators > 1 ? 's' : ''}</p>
                      <p className="text-xs text-gray-600 mt-2 leading-relaxed">{tier.deliverables}</p>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500">Profit: <span className="font-semibold text-green-600">{fmt(tier.profit)}</span></p>
                        <p className="text-xs text-gray-400">{tier.margin}% margin</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Creator Matches */}
          {creators.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Recommended Creators</h2>
              <div className="space-y-3">
                {creators.map(c => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{c.name} <span className="text-gray-400 font-normal">{c.handle}</span></p>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">{c.platform} · {c.niche} · {c.audience_uk_pct}% UK audience</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{fmtNum(c.followers)} followers</p>
                      <p className="text-xs text-gray-400">~{fmtNum(c.avg_views)} views · {fmt(c.rate_per_post)}/post</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column — Score */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-center mb-5">
              <p className={`text-5xl font-black ${scoreColor}`}>{lead.score}</p>
              <p className="text-gray-400 text-sm mt-1">Lead Score / 100</p>
              <div className="mt-2">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  lead.score >= 70 ? 'bg-green-100 text-green-700' :
                  lead.score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'
                }`}>
                  {lead.score >= 70 ? 'Strong lead' : lead.score >= 50 ? 'Moderate lead' : 'Weak lead'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {score.uk_relevance !== undefined && <>
                <ScoreBar label="UK Relevance" value={score.uk_relevance} max={20} />
                <ScoreBar label="Brand Fit" value={score.brand_fit} max={25} />
                <ScoreBar label="Budget Level" value={score.budget_level} max={20} />
                <ScoreBar label="Social Presence" value={score.social_presence} max={20} />
                <ScoreBar label="Campaign Likelihood" value={score.campaign_likelihood} max={15} />
              </>}
            </div>
          </div>

          {/* Score reasons */}
          {score.reasons && score.reasons.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Score Breakdown</h2>
              <ul className="space-y-2">
                {score.reasons.map((r, i) => (
                  <li key={i} className="text-xs text-gray-600 flex gap-2">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400">Added {new Date(lead.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
