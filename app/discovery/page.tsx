'use client';
import { useEffect, useState, useMemo } from 'react';

interface TikTokCreator {
  id: number;
  name: string;
  handle: string;
  bio: string;
  location: string;
  age: number;
  gender: string;
  followers: number;
  avg_views: number;
  avg_likes: number;
  avg_comments: number;
  engagement_rate: number;
  niches: string[];
  audience_age_18_24: number;
  audience_age_25_34: number;
  audience_female_pct: number;
  audience_uk_pct: number;
  audience_us_pct: number;
  rate_per_post: number;
  tiktok_url: string;
  verified: boolean;
}

const ALL_NICHES = [
  'beauty', 'comedy', 'culture', 'fashion', 'finance', 'fitness',
  'food', 'gaming', 'home', 'lifestyle', 'luxury', 'makeup',
  'mental health', 'music', 'parenting', 'pets', 'skincare',
  'sports', 'tech', 'travel', 'wellness',
];

const LOCATIONS = ['All', 'UK', 'US', 'UAE', 'Australia', 'Canada', 'Ireland', 'Germany', 'Other'];
const GENDERS = ['All', 'female', 'male', 'non-binary'];
const SORT_OPTIONS = [
  { value: 'followers', label: 'Followers' },
  { value: 'avg_views', label: 'Avg Views' },
  { value: 'engagement_rate', label: 'Engagement Rate' },
  { value: 'newest', label: 'Recently Added' },
];

const EMPTY_FORM = {
  name: '', handle: '', bio: '', location: 'UK', age: '', gender: 'female',
  followers: '', avg_views: '', avg_likes: '', avg_comments: '',
  engagement_rate: '', niches: [] as string[],
  audience_age_18_24: '', audience_age_25_34: '', audience_female_pct: '',
  audience_uk_pct: '', audience_us_pct: '', rate_per_post: '',
  tiktok_url: '', verified: false,
};

function fmt(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(n);
}

const LOCATION_FLAGS: Record<string, string> = {
  UK: '🇬🇧', US: '🇺🇸', UAE: '🇦🇪', Australia: '🇦🇺', Canada: '🇨🇦',
  Ireland: '🇮🇪', Germany: '🇩🇪',
};

const NICHE_COLORS: Record<string, string> = {
  beauty: 'bg-rose-100 text-rose-700',
  comedy: 'bg-yellow-100 text-yellow-700',
  culture: 'bg-amber-100 text-amber-700',
  fashion: 'bg-purple-100 text-purple-700',
  finance: 'bg-green-100 text-green-700',
  fitness: 'bg-orange-100 text-orange-700',
  food: 'bg-lime-100 text-lime-700',
  gaming: 'bg-blue-100 text-blue-700',
  home: 'bg-teal-100 text-teal-700',
  lifestyle: 'bg-indigo-100 text-indigo-700',
  luxury: 'bg-yellow-100 text-yellow-800',
  makeup: 'bg-pink-100 text-pink-700',
  'mental health': 'bg-cyan-100 text-cyan-700',
  music: 'bg-violet-100 text-violet-700',
  parenting: 'bg-sky-100 text-sky-700',
  pets: 'bg-emerald-100 text-emerald-700',
  skincare: 'bg-rose-100 text-rose-600',
  sports: 'bg-orange-100 text-orange-800',
  tech: 'bg-slate-100 text-slate-700',
  travel: 'bg-blue-100 text-blue-800',
  wellness: 'bg-teal-100 text-teal-800',
};

export default function DiscoveryPage() {
  const [creators, setCreators] = useState<TikTokCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<TikTokCreator | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterNiches, setFilterNiches] = useState<string[]>([]);
  const [filterLocation, setFilterLocation] = useState('All');
  const [filterGender, setFilterGender] = useState('All');
  const [minFollowers, setMinFollowers] = useState('');
  const [maxFollowers, setMaxFollowers] = useState('');
  const [minViews, setMinViews] = useState('');
  const [minEngagement, setMinEngagement] = useState('');
  const [maxEngagement, setMaxEngagement] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [minUkAudience, setMinUkAudience] = useState('');
  const [sortBy, setSortBy] = useState('followers');

  useEffect(() => {
    fetch('/api/discovery')
      .then(r => r.json())
      .then(d => { setCreators(d); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    let list = [...creators];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.handle.toLowerCase().includes(q) ||
        c.bio.toLowerCase().includes(q) ||
        c.niches.some(n => n.toLowerCase().includes(q))
      );
    }

    if (filterNiches.length > 0) {
      list = list.filter(c => filterNiches.every(n => c.niches.includes(n)));
    }

    if (filterLocation !== 'All') list = list.filter(c => c.location === filterLocation);
    if (filterGender !== 'All') list = list.filter(c => c.gender === filterGender);
    if (minFollowers) list = list.filter(c => c.followers >= Number(minFollowers));
    if (maxFollowers) list = list.filter(c => c.followers <= Number(maxFollowers));
    if (minViews) list = list.filter(c => c.avg_views >= Number(minViews));
    if (minEngagement) list = list.filter(c => c.engagement_rate >= Number(minEngagement));
    if (maxEngagement) list = list.filter(c => c.engagement_rate <= Number(maxEngagement));
    if (minAge) list = list.filter(c => c.age >= Number(minAge));
    if (maxAge) list = list.filter(c => c.age <= Number(maxAge));
    if (minUkAudience) list = list.filter(c => c.audience_uk_pct >= Number(minUkAudience));

    list.sort((a, b) => {
      if (sortBy === 'followers') return b.followers - a.followers;
      if (sortBy === 'avg_views') return b.avg_views - a.avg_views;
      if (sortBy === 'engagement_rate') return b.engagement_rate - a.engagement_rate;
      return b.id - a.id; // newest
    });

    return list;
  }, [creators, search, filterNiches, filterLocation, filterGender, minFollowers, maxFollowers, minViews, minEngagement, maxEngagement, minAge, maxAge, minUkAudience, sortBy]);

  function toggleNicheFilter(niche: string) {
    setFilterNiches(prev => prev.includes(niche) ? prev.filter(n => n !== niche) : [...prev, niche]);
  }

  function resetFilters() {
    setSearch('');
    setFilterNiches([]);
    setFilterLocation('All');
    setFilterGender('All');
    setMinFollowers('');
    setMaxFollowers('');
    setMinViews('');
    setMinEngagement('');
    setMaxEngagement('');
    setMinAge('');
    setMaxAge('');
    setMinUkAudience('');
    setSortBy('followers');
  }

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  }

  function openEdit(c: TikTokCreator) {
    setEditing(c);
    setForm({
      name: c.name, handle: c.handle, bio: c.bio, location: c.location,
      age: String(c.age), gender: c.gender,
      followers: String(c.followers), avg_views: String(c.avg_views),
      avg_likes: String(c.avg_likes), avg_comments: String(c.avg_comments),
      engagement_rate: String(c.engagement_rate), niches: [...c.niches],
      audience_age_18_24: String(c.audience_age_18_24),
      audience_age_25_34: String(c.audience_age_25_34),
      audience_female_pct: String(c.audience_female_pct),
      audience_uk_pct: String(c.audience_uk_pct),
      audience_us_pct: String(c.audience_us_pct),
      rate_per_post: String(c.rate_per_post),
      tiktok_url: c.tiktok_url, verified: c.verified,
    });
    setShowModal(true);
  }

  function buildBody() {
    return {
      name: form.name.trim(),
      handle: form.handle.trim().startsWith('@') ? form.handle.trim() : `@${form.handle.trim()}`,
      bio: form.bio.trim(), location: form.location, age: Number(form.age) || 0,
      gender: form.gender, followers: Number(form.followers) || 0,
      avg_views: Number(form.avg_views) || 0, avg_likes: Number(form.avg_likes) || 0,
      avg_comments: Number(form.avg_comments) || 0,
      engagement_rate: Number(form.engagement_rate) || 0,
      niches: form.niches,
      audience_age_18_24: Number(form.audience_age_18_24) || 0,
      audience_age_25_34: Number(form.audience_age_25_34) || 0,
      audience_female_pct: Number(form.audience_female_pct) || 0,
      audience_uk_pct: Number(form.audience_uk_pct) || 0,
      audience_us_pct: Number(form.audience_us_pct) || 0,
      rate_per_post: Number(form.rate_per_post) || 0,
      tiktok_url: form.tiktok_url.trim(), verified: form.verified,
    };
  }

  async function handleSave() {
    if (!form.name.trim() || !form.handle.trim()) return;
    setSaving(true);
    const body = buildBody();
    if (editing) {
      const res = await fetch(`/api/discovery/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const updated = await res.json();
      setCreators(prev => prev.map(c => c.id === editing.id ? updated : c));
    } else {
      const res = await fetch('/api/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const created = await res.json();
      setCreators(prev => [created, ...prev]);
    }
    setSaving(false);
    setShowModal(false);
  }

  async function handleDelete(id: number) {
    await fetch(`/api/discovery/${id}`, { method: 'DELETE' });
    setCreators(prev => prev.filter(c => c.id !== id));
    setDeleteConfirm(null);
  }

  const activeFilterCount = [
    filterNiches.length > 0, filterLocation !== 'All', filterGender !== 'All',
    minFollowers, maxFollowers, minViews, minEngagement, maxEngagement,
    minAge, maxAge, minUkAudience, search.trim(),
  ].filter(Boolean).length;

  if (loading) return <div className="text-gray-400 text-sm mt-10 text-center">Loading creators...</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            TikTok Discovery
            <span className="text-base font-normal text-gray-400">— targeted creator search</span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length} of {creators.length} creators
            {activeFilterCount > 0 && <span className="ml-1 text-indigo-600 font-medium">· {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(f => !f)}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${showFilters ? 'bg-gray-100 border-gray-200 text-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            {activeFilterCount > 0 && !showFilters && (
              <span className="ml-1.5 bg-indigo-600 text-white text-xs rounded-full px-1.5 py-0.5">{activeFilterCount}</span>
            )}
          </button>
          <button onClick={openAdd}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            + Add Creator
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, handle, bio, or niche..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 space-y-4">
          {/* Niches */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Niches</p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_NICHES.map(n => (
                <button key={n} onClick={() => toggleNicheFilter(n)}
                  className={`text-xs px-2.5 py-1 rounded-full border capitalize transition-colors ${
                    filterNiches.includes(n)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Row: Location, Gender, Sort */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Location</label>
              <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                {LOCATIONS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Gender</label>
              <select value={filterGender} onChange={e => setFilterGender(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 capitalize">
                {GENDERS.map(g => <option key={g} className="capitalize">{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Sort By</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Creator Age</label>
              <div className="flex gap-1 items-center">
                <input type="number" value={minAge} onChange={e => setMinAge(e.target.value)}
                  placeholder="Min" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                <span className="text-gray-400 text-xs">–</span>
                <input type="number" value={maxAge} onChange={e => setMaxAge(e.target.value)}
                  placeholder="Max" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Min UK Audience %</label>
              <input type="number" value={minUkAudience} onChange={e => setMinUkAudience(e.target.value)}
                placeholder="e.g. 60" className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>

          {/* Row: Followers, Views, Engagement */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Min Followers</label>
              <input type="number" value={minFollowers} onChange={e => setMinFollowers(e.target.value)}
                placeholder="e.g. 100000" className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Max Followers</label>
              <input type="number" value={maxFollowers} onChange={e => setMaxFollowers(e.target.value)}
                placeholder="e.g. 500000" className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Min Avg Views</label>
              <input type="number" value={minViews} onChange={e => setMinViews(e.target.value)}
                placeholder="e.g. 50000" className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Engagement Rate %</label>
              <div className="flex gap-1 items-center">
                <input type="number" step="0.1" value={minEngagement} onChange={e => setMinEngagement(e.target.value)}
                  placeholder="Min" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                <span className="text-gray-400 text-xs">–</span>
                <input type="number" step="0.1" value={maxEngagement} onChange={e => setMaxEngagement(e.target.value)}
                  placeholder="Max" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <div className="pt-1">
              <button onClick={resetFilters}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline">
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No creators match your filters.</p>
          <button onClick={resetFilters} className="mt-2 text-indigo-600 text-sm font-medium hover:underline">Clear filters</button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(c => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-200 transition-colors">
              {/* Top row */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-gray-900 truncate">{c.name}</p>
                    {c.verified && (
                      <svg className="w-4 h-4 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{c.handle}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {LOCATION_FLAGS[c.location] || '🌍'} {c.location}
                    {c.age > 0 && <span> · Age {c.age}</span>}
                    {c.gender && <span className="capitalize"> · {c.gender}</span>}
                  </p>
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

              {/* Bio */}
              {c.bio && (
                <p className="text-xs text-gray-500 mb-2.5 line-clamp-2 leading-relaxed">{c.bio}</p>
              )}

              {/* Niches */}
              {c.niches.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {c.niches.map(n => (
                    <span key={n} className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${NICHE_COLORS[n] || 'bg-gray-100 text-gray-600'}`}>
                      {n}
                    </span>
                  ))}
                </div>
              )}

              {/* Key stats */}
              <div className="grid grid-cols-3 gap-x-3 gap-y-2 text-center bg-gray-50 rounded-lg p-2.5 mb-3">
                <div>
                  <p className="text-xs text-gray-400">Followers</p>
                  <p className="text-sm font-bold text-gray-800">{fmt(c.followers)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Avg Views</p>
                  <p className="text-sm font-bold text-gray-800">{fmt(c.avg_views)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Engagement</p>
                  <p className={`text-sm font-bold ${c.engagement_rate >= 10 ? 'text-green-600' : c.engagement_rate >= 7 ? 'text-indigo-600' : 'text-gray-800'}`}>
                    {c.engagement_rate.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Audience breakdown */}
              <div className="flex gap-3 text-xs text-gray-500 mb-3">
                {c.audience_female_pct > 0 && <span>👩 {c.audience_female_pct}% female</span>}
                {c.audience_uk_pct > 0 && <span>🇬🇧 {c.audience_uk_pct}% UK</span>}
                {c.audience_age_18_24 > 0 && <span>18–24: {c.audience_age_18_24}%</span>}
              </div>

              {/* Rate + TikTok link */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">
                  {c.rate_per_post > 0 ? `£${c.rate_per_post.toLocaleString('en-GB')}/post` : 'Rate TBC'}
                </span>
                {c.tiktok_url ? (
                  <a href={c.tiktok_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:underline font-medium">
                    View Profile →
                  </a>
                ) : (
                  <span className="text-xs text-gray-300">No link</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 my-6">
            <h2 className="text-lg font-bold mb-4">{editing ? 'Edit Creator' : 'Add TikTok Creator'}</h2>
            <div className="space-y-4">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Jordan Hayes"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Handle *</label>
                  <input value={form.handle} onChange={e => setForm(f => ({ ...f, handle: e.target.value }))}
                    placeholder="@handle"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Bio</label>
                <input value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Short bio or description..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Location</label>
                  <select value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    {LOCATIONS.filter(l => l !== 'All').map(l => <option key={l}>{l}</option>)}
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Age</label>
                  <input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                    placeholder="24"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Gender</label>
                  <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm capitalize focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    {GENDERS.filter(g => g !== 'All').map(g => <option key={g} className="capitalize">{g}</option>)}
                  </select>
                </div>
              </div>

              {/* Niches */}
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1.5">Niches</label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_NICHES.map(n => (
                    <button key={n} type="button"
                      onClick={() => setForm(f => ({
                        ...f,
                        niches: f.niches.includes(n) ? f.niches.filter(x => x !== n) : [...f.niches, n],
                      }))}
                      className={`text-xs px-2.5 py-1 rounded-full border capitalize transition-colors ${
                        form.niches.includes(n)
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Performance */}
              <div>
                <p className="text-xs text-gray-500 font-medium mb-2">Performance</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Followers</label>
                    <input type="number" value={form.followers} onChange={e => setForm(f => ({ ...f, followers: e.target.value }))}
                      placeholder="320000"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Avg Views</label>
                    <input type="number" value={form.avg_views} onChange={e => setForm(f => ({ ...f, avg_views: e.target.value }))}
                      placeholder="95000"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Avg Likes</label>
                    <input type="number" value={form.avg_likes} onChange={e => setForm(f => ({ ...f, avg_likes: e.target.value }))}
                      placeholder="28000"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Engagement %</label>
                    <input type="number" step="0.1" value={form.engagement_rate} onChange={e => setForm(f => ({ ...f, engagement_rate: e.target.value }))}
                      placeholder="8.7"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  </div>
                </div>
              </div>

              {/* Audience */}
              <div>
                <p className="text-xs text-gray-500 font-medium mb-2">Audience Demographics</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">% Female</label>
                    <input type="number" min="0" max="100" value={form.audience_female_pct} onChange={e => setForm(f => ({ ...f, audience_female_pct: e.target.value }))}
                      placeholder="78"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">% UK</label>
                    <input type="number" min="0" max="100" value={form.audience_uk_pct} onChange={e => setForm(f => ({ ...f, audience_uk_pct: e.target.value }))}
                      placeholder="72"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">% US</label>
                    <input type="number" min="0" max="100" value={form.audience_us_pct} onChange={e => setForm(f => ({ ...f, audience_us_pct: e.target.value }))}
                      placeholder="15"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">% Age 18–24</label>
                    <input type="number" min="0" max="100" value={form.audience_age_18_24} onChange={e => setForm(f => ({ ...f, audience_age_18_24: e.target.value }))}
                      placeholder="45"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  </div>
                </div>
              </div>

              {/* Rate & TikTok URL */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Rate / Post (£)</label>
                  <input type="number" value={form.rate_per_post} onChange={e => setForm(f => ({ ...f, rate_per_post: e.target.value }))}
                    placeholder="1800"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">TikTok URL</label>
                  <input value={form.tiktok_url} onChange={e => setForm(f => ({ ...f, tiktok_url: e.target.value }))}
                    placeholder="https://tiktok.com/@handle"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.verified} onChange={e => setForm(f => ({ ...f, verified: e.target.checked }))}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-400" />
                <span className="text-sm text-gray-700">Verified account</span>
              </label>
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
