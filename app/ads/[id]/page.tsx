'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface TikTokAd {
  id: number;
  title: string;
  brand_name: string;
  creator_name: string;
  tiktok_url: string;
  video_filename: string;
  campaign_date: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  impressions: number;
  profile_visits: number;
  follows: number;
  ad_spend: number;
  clicks: number;
  niche: string;
  notes: string;
  created_at: string;
}

interface LibraryAd {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}

function er(ad: { views: number; likes: number; comments: number; shares: number; saves: number }) {
  if (!ad.views) return 0;
  return ((ad.likes + ad.comments + ad.shares + ad.saves) / ad.views) * 100;
}

function rate(part: number, total: number) {
  if (!total) return 0;
  return (part / total) * 100;
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k';
  return n.toLocaleString('en-GB');
}

function MetricBar({ label, value, max, color = 'bg-indigo-500' }: { label: string; value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span>
        <span className="font-semibold text-gray-700">{value.toFixed(2)}%</span>
      </div>
      <div className="bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatBox({ label, value, sub, color = 'text-gray-900' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function generateInsights(ad: TikTokAd, libAvgER: number): string[] {
  const insights: string[] = [];
  const adER = er(ad);
  const shareRate = rate(ad.shares, ad.views);
  const saveRate = rate(ad.saves, ad.views);
  const commentRate = rate(ad.comments, ad.views);
  const followRate = rate(ad.follows, ad.views);
  const profileRate = rate(ad.profile_visits, ad.views);

  if (adER >= 6) insights.push('Exceptional engagement rate — this ad significantly outperforms the 3-6% TikTok benchmark. Strong candidate for boosting.');
  else if (adER >= 3) insights.push('Solid engagement rate above the 3% TikTok average. Content resonated well with the audience.');
  else if (adER > 0) insights.push('Engagement rate below the 3% TikTok benchmark. Consider testing hooks or CTAs in a revised version.');

  if (libAvgER > 0) {
    if (adER > libAvgER * 1.2) insights.push(`Outperforms your library average of ${libAvgER.toFixed(1)}% ER by ${((adER / libAvgER - 1) * 100).toFixed(0)}%.`);
    else if (adER < libAvgER * 0.8) insights.push(`Underperforms your library average of ${libAvgER.toFixed(1)}% ER. Review what made top performers succeed.`);
    else insights.push(`Performs in line with your library average of ${libAvgER.toFixed(1)}% ER.`);
  }

  if (shareRate >= 2) insights.push('High share rate — this content has strong viral potential. Could be repurposed or boosted.');
  else if (shareRate >= 1) insights.push('Above-average share rate suggests the content is shareable and resonates beyond the initial audience.');

  if (saveRate >= 3) insights.push('High save rate indicates genuinely useful or aspirational content. Great for brand recall.');
  else if (saveRate >= 1.5) insights.push('Good save rate — audience found the content worth returning to.');

  if (commentRate >= 1) insights.push('Strong comment rate signals high audience interaction. Responding to comments can extend reach organically.');

  if (followRate >= 0.5) insights.push('Notable follow rate from this ad — the content is effectively converting viewers into followers.');

  if (profileRate >= 2) insights.push('High profile visit rate suggests viewers want to learn more about the brand/creator. Ensure profiles are optimised.');

  if (ad.ad_spend > 0 && ad.views > 0) {
    const cpm = (ad.ad_spend / ad.views) * 1000;
    const cpe = ad.ad_spend / Math.max(ad.likes + ad.comments + ad.shares + ad.saves, 1);
    insights.push(`Paid CPM: £${cpm.toFixed(2)}. Cost per engagement: £${cpe.toFixed(2)}.`);
  }

  if (ad.views > 0 && ad.reach > 0) {
    const freq = ad.views / ad.reach;
    if (freq > 2) insights.push(`Average view frequency of ${freq.toFixed(1)}x per user — audience is re-watching. Strong content hook.`);
  }

  if (insights.length === 0) insights.push('Add performance metrics to see insights for this ad.');
  return insights;
}

const NICHES = ['fashion', 'beauty', 'lifestyle', 'fitness', 'food', 'travel', 'tech', 'other'];
const INT_FIELDS = ['views', 'likes', 'comments', 'shares', 'saves', 'reach', 'impressions', 'profile_visits', 'follows', 'ad_spend', 'clicks'];
const TEXT_FIELDS = ['title', 'brand_name', 'creator_name', 'tiktok_url', 'campaign_date', 'niche', 'notes'];

export default function AdDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [ad, setAd] = useState<TikTokAd | null>(null);
  const [libraryAds, setLibraryAds] = useState<LibraryAd[]>([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Record<string, string>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/ads/${id}`).then(r => r.json()).then(setAd);
    fetch('/api/ads').then(r => r.json()).then(setLibraryAds);
  }, [id]);

  async function saveEdit() {
    setSaving(true);
    const body: Record<string, string | number> = {};
    for (const f of TEXT_FIELDS) if (editForm[f] !== undefined) body[f] = editForm[f] as string;
    for (const f of INT_FIELDS) if (editForm[f] !== undefined) body[f] = parseInt(editForm[f] as string) || 0;
    const res = await fetch(`/api/ads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const updated = await res.json();
    setAd(updated);
    setEditing(false);
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm('Delete this ad?')) return;
    await fetch(`/api/ads/${id}`, { method: 'DELETE' });
    router.push('/ads');
  }

  if (!ad) return <div className="text-gray-400 text-sm mt-10 text-center">Loading...</div>;

  const adER = er(ad);
  const libAvgER = libraryAds.length > 1
    ? libraryAds.filter(a => (a as unknown as TikTokAd).id !== ad.id).reduce((s, a) => s + er(a), 0) / (libraryAds.length - 1)
    : 0;

  const insights = generateInsights(ad, libAvgER);

  const erBenchmark = 6;
  const erColor = adER >= 6 ? 'text-green-600' : adER >= 3 ? 'text-yellow-600' : 'text-red-500';

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <Link href="/ads" className="text-sm text-gray-400 hover:text-gray-600 block mb-1">← Ad Library</Link>
          <h1 className="text-2xl font-bold">{ad.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {ad.brand_name}
            {ad.creator_name && ` · ${ad.creator_name}`}
            {ad.campaign_date && ` · ${new Date(ad.campaign_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
            {ad.niche && <span className="ml-1 capitalize text-purple-500">· {ad.niche}</span>}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href={`/ads/report/${encodeURIComponent(ad.brand_name)}`}
            className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Brand Report
          </Link>
          <button onClick={() => { setEditing(true); setEditForm(Object.fromEntries([...TEXT_FIELDS, ...INT_FIELDS].map(f => [f, String((ad as unknown as Record<string, unknown>)[f] ?? '')]))) }}
            className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Edit
          </button>
          <button onClick={handleDelete}
            className="text-sm px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
            Delete
          </button>
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Edit Ad</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'title', label: 'Title', col: 2 },
                  { key: 'brand_name', label: 'Brand' },
                  { key: 'creator_name', label: 'Creator' },
                  { key: 'tiktok_url', label: 'TikTok URL', col: 2 },
                  { key: 'campaign_date', label: 'Date', type: 'date' },
                ].map(({ key, label, col, type }) => (
                  <div key={key} className={col === 2 ? 'col-span-2' : ''}>
                    <label className="text-xs text-gray-500 block mb-1">{label}</label>
                    <input type={type ?? 'text'} value={editForm[key] ?? ''} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Niche</label>
                  <select value={editForm.niche ?? ''} onChange={e => setEditForm(f => ({ ...f, niche: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    <option value="">— select —</option>
                    {NICHES.map(n => <option key={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide pt-1">Metrics</p>
              <div className="grid grid-cols-3 gap-2">
                {INT_FIELDS.map(f => (
                  <div key={f}>
                    <label className="text-xs text-gray-400 block mb-1 capitalize">{f.replace(/_/g, ' ')}</label>
                    <input type="number" min="0" value={editForm[f] ?? ''} onChange={e => setEditForm(p => ({ ...p, [f]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Notes</label>
                <textarea value={editForm.notes ?? ''} rows={2} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={saveEdit} disabled={saving}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setEditing(false)}
                className="text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left col */}
        <div className="lg:col-span-2 space-y-5">

          {/* Video */}
          {(ad.video_filename || ad.tiktok_url) && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {ad.video_filename ? (
                <video
                  src={`/uploads/ads/${ad.video_filename}`}
                  controls
                  className="w-full max-h-96 bg-black"
                />
              ) : (
                <div className="p-5">
                  <p className="text-xs text-gray-500 font-medium mb-2">TikTok Link</p>
                  <a href={ad.tiktok_url} target="_blank" rel="noopener noreferrer"
                    className="text-indigo-600 text-sm hover:underline break-all">{ad.tiktok_url}</a>
                </div>
              )}
            </div>
          )}

          {/* Core stats */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Performance Overview</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBox label="Views" value={fmtNum(ad.views)} color="text-gray-900" />
              <StatBox label="Likes" value={fmtNum(ad.likes)} />
              <StatBox label="Comments" value={fmtNum(ad.comments)} />
              <StatBox label="Shares" value={fmtNum(ad.shares)} />
              <StatBox label="Saves" value={fmtNum(ad.saves)} />
              {ad.reach > 0 && <StatBox label="Reach" value={fmtNum(ad.reach)} />}
              {ad.impressions > 0 && <StatBox label="Impressions" value={fmtNum(ad.impressions)} />}
              {ad.profile_visits > 0 && <StatBox label="Profile Visits" value={fmtNum(ad.profile_visits)} />}
              {ad.follows > 0 && <StatBox label="New Follows" value={fmtNum(ad.follows)} />}
            </div>
          </div>

          {/* Engagement breakdown */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Engagement Breakdown</h2>
            <div className="space-y-4">
              <MetricBar label="Like Rate" value={rate(ad.likes, ad.views)} max={15} color="bg-pink-400" />
              <MetricBar label="Comment Rate" value={rate(ad.comments, ad.views)} max={5} color="bg-blue-400" />
              <MetricBar label="Share Rate" value={rate(ad.shares, ad.views)} max={5} color="bg-green-400" />
              <MetricBar label="Save Rate" value={rate(ad.saves, ad.views)} max={8} color="bg-yellow-400" />
              {ad.profile_visits > 0 && (
                <MetricBar label="Profile Visit Rate" value={rate(ad.profile_visits, ad.views)} max={5} color="bg-purple-400" />
              )}
              {ad.follows > 0 && (
                <MetricBar label="Follow Rate" value={rate(ad.follows, ad.views)} max={2} color="bg-indigo-400" />
              )}
            </div>
          </div>

          {/* Paid performance */}
          {ad.ad_spend > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Paid Performance</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatBox label="Ad Spend" value={`£${ad.ad_spend.toLocaleString('en-GB')}`} />
                {ad.views > 0 && <StatBox label="CPM" value={`£${((ad.ad_spend / ad.views) * 1000).toFixed(2)}`} sub="cost per 1k views" />}
                {ad.clicks > 0 && <>
                  <StatBox label="Clicks" value={fmtNum(ad.clicks)} />
                  <StatBox label="CPC" value={`£${(ad.ad_spend / ad.clicks).toFixed(2)}`} sub="cost per click" />
                  <StatBox label="CTR" value={`${rate(ad.clicks, ad.views).toFixed(2)}%`} sub="click-through rate" />
                </>}
                {ad.views > 0 && (
                  <StatBox
                    label="Cost per Engagement"
                    value={`£${(ad.ad_spend / Math.max(ad.likes + ad.comments + ad.shares + ad.saves, 1)).toFixed(2)}`}
                  />
                )}
              </div>
            </div>
          )}

          {/* Insights */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Performance Insights</h2>
            <ul className="space-y-3">
              {insights.map((insight, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-700">
                  <span className="text-indigo-400 mt-0.5 shrink-0">→</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>

          {ad.notes && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Notes</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{ad.notes}</p>
            </div>
          )}
        </div>

        {/* Right col — ER summary */}
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-center mb-5">
              <p className={`text-5xl font-black ${erColor}`}>{adER.toFixed(1)}%</p>
              <p className="text-gray-400 text-sm mt-1">Engagement Rate</p>
              <div className="mt-2">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  adER >= 6 ? 'bg-green-100 text-green-700' :
                  adER >= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'
                }`}>
                  {adER >= 6 ? 'Excellent' : adER >= 3 ? 'Good' : adER > 0 ? 'Below Avg' : 'No data'}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-100">
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>This ad</span>
                  <span className="font-semibold">{adER.toFixed(2)}%</span>
                </div>
                <div className="bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${Math.min((adER / erBenchmark) * 100, 100)}%` }} />
                </div>
              </div>
              {libAvgER > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Library average</span>
                    <span className="font-semibold">{libAvgER.toFixed(2)}%</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full bg-gray-400" style={{ width: `${Math.min((libAvgER / erBenchmark) * 100, 100)}%` }} />
                  </div>
                </div>
              )}
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>TikTok benchmark</span>
                  <span className="font-semibold">3–6%</span>
                </div>
                <div className="bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full bg-gray-200" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick metric cards */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Rate Breakdown</h2>
            {[
              { label: 'Like rate', value: rate(ad.likes, ad.views) },
              { label: 'Comment rate', value: rate(ad.comments, ad.views) },
              { label: 'Share rate', value: rate(ad.shares, ad.views) },
              { label: 'Save rate', value: rate(ad.saves, ad.views) },
              ...(ad.follows ? [{ label: 'Follow rate', value: rate(ad.follows, ad.views) }] : []),
            ].map(m => (
              <div key={m.label} className="flex justify-between text-sm">
                <span className="text-gray-500">{m.label}</span>
                <span className="font-semibold text-gray-800">{m.value.toFixed(2)}%</span>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 text-xs text-gray-400">
            Added {new Date(ad.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>
    </div>
  );
}
