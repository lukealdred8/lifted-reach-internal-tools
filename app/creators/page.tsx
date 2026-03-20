'use client';
import { useEffect, useState } from 'react';

interface Creator {
  id: number;
  name: string;
  handle: string;
  platform: 'Instagram' | 'TikTok' | 'YouTube';
  niche: 'fashion' | 'beauty' | 'lifestyle';
  followers: number;
  avg_views: number;
  rate_per_post: number;
  audience_uk_pct: number;
}

const PLATFORMS = ['Instagram', 'TikTok', 'YouTube'];
const NICHES = ['fashion', 'beauty', 'lifestyle'];

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: 'bg-pink-100 text-pink-700',
  TikTok: 'bg-gray-100 text-gray-700',
  YouTube: 'bg-red-100 text-red-700',
};

const NICHE_COLORS: Record<string, string> = {
  fashion: 'bg-purple-100 text-purple-700',
  beauty: 'bg-rose-100 text-rose-700',
  lifestyle: 'bg-teal-100 text-teal-700',
};

function fmt(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(n);
}

const EMPTY_FORM = {
  name: '', handle: '', platform: 'Instagram', niche: 'fashion',
  followers: '', avg_views: '', rate_per_post: '', audience_uk_pct: '70',
};

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Creator | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [filterNiche, setFilterNiche] = useState('All');
  const [filterPlatform, setFilterPlatform] = useState('All');

  useEffect(() => {
    fetch('/api/creators').then(r => r.json()).then(d => { setCreators(d); setLoading(false); });
  }, []);

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  }

  function openEdit(c: Creator) {
    setEditing(c);
    setForm({
      name: c.name,
      handle: c.handle,
      platform: c.platform,
      niche: c.niche,
      followers: String(c.followers),
      avg_views: String(c.avg_views),
      rate_per_post: String(c.rate_per_post),
      audience_uk_pct: String(c.audience_uk_pct),
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.handle.trim()) return;
    setSaving(true);
    const body = {
      name: form.name.trim(),
      handle: form.handle.trim().startsWith('@') ? form.handle.trim() : `@${form.handle.trim()}`,
      platform: form.platform,
      niche: form.niche,
      followers: Number(form.followers) || 0,
      avg_views: Number(form.avg_views) || 0,
      rate_per_post: Number(form.rate_per_post) || 0,
      audience_uk_pct: Number(form.audience_uk_pct) || 70,
    };
    if (editing) {
      const res = await fetch(`/api/creators/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const updated = await res.json();
      setCreators(prev => prev.map(c => c.id === editing.id ? updated : c));
    } else {
      const res = await fetch('/api/creators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const created = await res.json();
      setCreators(prev => [...prev, created]);
    }
    setSaving(false);
    setShowModal(false);
  }

  async function handleDelete(id: number) {
    await fetch(`/api/creators/${id}`, { method: 'DELETE' });
    setCreators(prev => prev.filter(c => c.id !== id));
    setDeleteConfirm(null);
  }

  const filtered = creators.filter(c => {
    if (filterNiche !== 'All' && c.niche !== filterNiche) return false;
    if (filterPlatform !== 'All' && c.platform !== filterPlatform) return false;
    return true;
  });

  if (loading) return <div className="text-gray-400 text-sm mt-10 text-center">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold">Creators</h1>
          <p className="text-sm text-gray-500 mt-0.5">{creators.length} creators total</p>
        </div>
        <button onClick={openAdd}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          + Add Creator
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-5">
        <div className="flex flex-wrap gap-1.5">
          {['All', ...NICHES].map(n => (
            <button key={n} onClick={() => setFilterNiche(n)}
              className={`text-sm px-3 py-1 rounded-full border transition-colors capitalize ${
                filterNiche === n ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}>
              {n}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['All', ...PLATFORMS].map(p => (
            <button key={p} onClick={() => setFilterPlatform(p)}
              className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                filterPlatform === p ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No creators yet.</p>
          <button onClick={openAdd} className="mt-2 text-indigo-600 text-sm font-medium hover:underline">Add one →</button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(c => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-200 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{c.name}</p>
                  <p className="text-sm text-gray-400">{c.handle}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(c)}
                    className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                    Edit
                  </button>
                  {deleteConfirm === c.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleDelete(c.id)}
                        className="text-xs px-2 py-1 rounded border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                        Confirm
                      </button>
                      <button onClick={() => setDeleteConfirm(null)}
                        className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(c.id)}
                      className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors">
                      Delete
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-1.5 mt-3 flex-wrap">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PLATFORM_COLORS[c.platform]}`}>{c.platform}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${NICHE_COLORS[c.niche]}`}>{c.niche}</span>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3">
                <div>
                  <p className="text-xs text-gray-400">Followers</p>
                  <p className="text-sm font-semibold text-gray-800">{fmt(c.followers)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Avg Views</p>
                  <p className="text-sm font-semibold text-gray-800">{fmt(c.avg_views)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Rate / Post</p>
                  <p className="text-sm font-semibold text-gray-800">£{c.rate_per_post.toLocaleString('en-GB')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">UK Audience</p>
                  <p className="text-sm font-semibold text-gray-800">{c.audience_uk_pct}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">{editing ? 'Edit Creator' : 'Add Creator'}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Sophia Ellis"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Handle *</label>
                  <input value={form.handle} onChange={e => setForm(f => ({ ...f, handle: e.target.value }))}
                    placeholder="@handle"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Platform *</label>
                  <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Niche *</label>
                  <select value={form.niche} onChange={e => setForm(f => ({ ...f, niche: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm capitalize focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    {NICHES.map(n => <option key={n} className="capitalize">{n}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Followers</label>
                  <input type="number" value={form.followers} onChange={e => setForm(f => ({ ...f, followers: e.target.value }))}
                    placeholder="180000"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Avg Views</label>
                  <input type="number" value={form.avg_views} onChange={e => setForm(f => ({ ...f, avg_views: e.target.value }))}
                    placeholder="12000"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Rate / Post (£)</label>
                  <input type="number" value={form.rate_per_post} onChange={e => setForm(f => ({ ...f, rate_per_post: e.target.value }))}
                    placeholder="1200"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">UK Audience %</label>
                  <input type="number" min="0" max="100" value={form.audience_uk_pct} onChange={e => setForm(f => ({ ...f, audience_uk_pct: e.target.value }))}
                    placeholder="70"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !form.name.trim() || !form.handle.trim()}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Creator'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
