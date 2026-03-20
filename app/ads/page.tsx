'use client';
import { useEffect, useState, useRef } from 'react';
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

const NICHES = ['fashion', 'beauty', 'lifestyle', 'fitness', 'food', 'travel', 'tech', 'other'];

function engagementRate(ad: TikTokAd) {
  if (!ad.views) return 0;
  return ((ad.likes + ad.comments + ad.shares + ad.saves) / ad.views) * 100;
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k';
  return String(n);
}

function erColor(rate: number) {
  if (rate >= 6) return 'text-green-600 bg-green-50';
  if (rate >= 3) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-500 bg-red-50';
}

const EMPTY: Record<string, string> = {
  title: '', brand_name: '', creator_name: '', tiktok_url: '',
  campaign_date: '', niche: '', notes: '',
  views: '', likes: '', comments: '', shares: '', saves: '',
  reach: '', impressions: '', profile_visits: '', follows: '',
  ad_spend: '', clicks: '',
};

export default function AdsPage() {
  const [ads, setAds] = useState<TikTokAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterBrand, setFilterBrand] = useState('All');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/ads').then(r => r.json()).then(d => { setAds(d); setLoading(false); });
  }, []);

  const brands = Array.from(new Set(ads.map(a => a.brand_name))).sort();
  const filtered = filterBrand === 'All' ? ads : ads.filter(a => a.brand_name === filterBrand);

  const totalViews = filtered.reduce((s, a) => s + a.views, 0);
  const avgER = filtered.length
    ? filtered.reduce((s, a) => s + engagementRate(a), 0) / filtered.length
    : 0;
  const totalBrands = new Set(filtered.map(a => a.brand_name)).size;

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSave() {
    if (!form.title.trim() || !form.brand_name.trim()) return;
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (videoFile) fd.append('video', videoFile);
    const res = await fetch('/api/ads', { method: 'POST', body: fd });
    const created = await res.json();
    setAds(prev => [created, ...prev]);
    setShowModal(false);
    setForm({ ...EMPTY });
    setVideoFile(null);
    setSaving(false);
  }

  async function handleDelete(id: number) {
    await fetch(`/api/ads/${id}`, { method: 'DELETE' });
    setAds(prev => prev.filter(a => a.id !== id));
    setDeleteConfirm(null);
  }

  if (loading) return <div className="text-gray-400 text-sm mt-10 text-center">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold">Ad Library</h1>
          <p className="text-sm text-gray-500 mt-0.5">{ads.length} ads · {new Set(ads.map(a => a.brand_name)).size} brands</p>
        </div>
        <button onClick={() => { setShowModal(true); setForm({ ...EMPTY }); setVideoFile(null); }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          + Upload Ad
        </button>
      </div>

      {/* Summary stats */}
      {ads.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total Views', value: fmtNum(totalViews) },
            { label: 'Avg Engagement', value: avgER.toFixed(2) + '%' },
            { label: 'Total Ads', value: String(filtered.length) },
            { label: 'Brands', value: String(totalBrands) },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Brand filter */}
      {brands.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {['All', ...brands].map(b => (
            <button key={b} onClick={() => setFilterBrand(b)}
              className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                filterBrand === b ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}>
              {b}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🎬</p>
          <p className="font-medium">No ads yet.</p>
          <p className="text-sm mt-1">Upload your first TikTok ad to start tracking performance.</p>
          <button onClick={() => setShowModal(true)} className="mt-3 text-indigo-600 text-sm font-medium hover:underline">
            Upload now →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(ad => {
            const er = engagementRate(ad);
            return (
              <div key={ad.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-200 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/ads/${ad.id}`} className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors truncate">
                        {ad.title}
                      </Link>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${erColor(er)}`}>
                        {er.toFixed(1)}% ER
                      </span>
                      {ad.niche && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 capitalize">{ad.niche}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {ad.brand_name}
                      {ad.creator_name && ` · ${ad.creator_name}`}
                      {ad.campaign_date && ` · ${ad.campaign_date}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-gray-900">{fmtNum(ad.views)}</p>
                    <p className="text-xs text-gray-400">views</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
                  {[
                    { label: '❤️', value: fmtNum(ad.likes) },
                    { label: '💬', value: fmtNum(ad.comments) },
                    { label: '🔁', value: fmtNum(ad.shares) },
                    { label: '🔖', value: fmtNum(ad.saves) },
                    ...(ad.reach ? [{ label: 'Reach', value: fmtNum(ad.reach) }] : []),
                  ].map(m => (
                    <span key={m.label} className="text-xs text-gray-500">{m.label} {m.value}</span>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <Link href={`/ads/${ad.id}`}
                    className="text-xs px-2.5 py-1 rounded-full border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors">
                    Deep Analysis →
                  </Link>
                  <Link href={`/ads/report/${encodeURIComponent(ad.brand_name)}`}
                    className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                    Brand Report
                  </Link>
                  {ad.tiktok_url && (
                    <a href={ad.tiktok_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                      TikTok ↗
                    </a>
                  )}
                  <div className="ml-auto flex gap-1">
                    {deleteConfirm === ad.id ? (
                      <>
                        <button onClick={() => handleDelete(ad.id)}
                          className="text-xs px-2.5 py-1 rounded-full border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                          Confirm delete
                        </button>
                        <button onClick={() => setDeleteConfirm(null)}
                          className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setDeleteConfirm(ad.id)}
                        className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors">
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Ad Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold mb-4">Upload TikTok Ad</h2>
              <div className="space-y-4">

                {/* Video upload */}
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Video File</label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors">
                    {videoFile ? (
                      <div>
                        <p className="text-sm font-medium text-gray-700">{videoFile.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{(videoFile.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-2xl mb-1">🎬</p>
                        <p className="text-sm text-gray-500">Click to upload video</p>
                        <p className="text-xs text-gray-400 mt-0.5">MP4, MOV, AVI supported</p>
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="video/*" className="hidden"
                    onChange={e => setVideoFile(e.target.files?.[0] ?? null)} />
                </div>

                {/* Basic info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500 font-medium block mb-1">Ad Title *</label>
                    <input value={form.title} onChange={e => set('title', e.target.value)}
                      placeholder="e.g. ASOS Summer Collection"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium block mb-1">Brand *</label>
                    <input value={form.brand_name} onChange={e => set('brand_name', e.target.value)}
                      placeholder="ASOS"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium block mb-1">Creator</label>
                    <input value={form.creator_name} onChange={e => set('creator_name', e.target.value)}
                      placeholder="Sophia Ellis"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium block mb-1">Campaign Date</label>
                    <input type="date" value={form.campaign_date} onChange={e => set('campaign_date', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium block mb-1">Niche</label>
                    <select value={form.niche} onChange={e => set('niche', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                      <option value="">— select —</option>
                      {NICHES.map(n => <option key={n} className="capitalize">{n}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500 font-medium block mb-1">TikTok URL</label>
                    <input value={form.tiktok_url} onChange={e => set('tiktok_url', e.target.value)}
                      placeholder="https://www.tiktok.com/@..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  </div>
                </div>

                {/* Performance metrics */}
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Performance Metrics</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'views', label: 'Views' },
                      { key: 'likes', label: 'Likes' },
                      { key: 'comments', label: 'Comments' },
                      { key: 'shares', label: 'Shares' },
                      { key: 'saves', label: 'Saves' },
                      { key: 'reach', label: 'Reach' },
                      { key: 'impressions', label: 'Impressions' },
                      { key: 'profile_visits', label: 'Profile Visits' },
                      { key: 'follows', label: 'New Follows' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="text-xs text-gray-400 block mb-1">{label}</label>
                        <input type="number" min="0" value={form[key]} onChange={e => set(key, e.target.value)}
                          placeholder="0"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Paid metrics */}
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Paid Metrics (optional)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Ad Spend (£)</label>
                      <input type="number" min="0" value={form.ad_spend} onChange={e => set('ad_spend', e.target.value)}
                        placeholder="0"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Clicks</label>
                      <input type="number" min="0" value={form.clicks} onChange={e => set('clicks', e.target.value)}
                        placeholder="0"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Notes</label>
                  <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                    rows={2} placeholder="Any additional context..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving || !form.title.trim() || !form.brand_name.trim()}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
                  {saving ? 'Uploading...' : 'Save Ad'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
