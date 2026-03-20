'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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
}

function er(ad: TikTokAd) {
  if (!ad.views) return 0;
  return ((ad.likes + ad.comments + ad.shares + ad.saves) / ad.views) * 100;
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k';
  return n.toLocaleString('en-GB');
}

function erBadge(rate: number) {
  if (rate >= 6) return 'bg-green-100 text-green-700';
  if (rate >= 3) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-600';
}

function erLabel(rate: number) {
  if (rate >= 6) return 'Excellent';
  if (rate >= 3) return 'Good';
  if (rate > 0) return 'Below Avg';
  return '—';
}

export default function BrandReportPage() {
  const { brand } = useParams();
  const brandName = decodeURIComponent(brand as string);
  const [ads, setAds] = useState<TikTokAd[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/ads?brand=${encodeURIComponent(brandName)}`)
      .then(r => r.json())
      .then(d => { setAds(d); setLoading(false); });
  }, [brandName]);

  if (loading) return <div className="text-gray-400 text-sm mt-10 text-center">Loading...</div>;

  const totalViews = ads.reduce((s, a) => s + a.views, 0);
  const totalLikes = ads.reduce((s, a) => s + a.likes, 0);
  const totalComments = ads.reduce((s, a) => s + a.comments, 0);
  const totalShares = ads.reduce((s, a) => s + a.shares, 0);
  const totalSaves = ads.reduce((s, a) => s + a.saves, 0);
  const totalReach = ads.reduce((s, a) => s + a.reach, 0);
  const totalSpend = ads.reduce((s, a) => s + a.ad_spend, 0);
  const avgER = ads.length ? ads.reduce((s, a) => s + er(a), 0) / ads.length : 0;
  const totalEngagements = totalLikes + totalComments + totalShares + totalSaves;
  const overallER = totalViews ? (totalEngagements / totalViews) * 100 : 0;
  const bestAd = ads.length ? [...ads].sort((a, b) => er(b) - er(a))[0] : null;

  return (
    <div>
      {/* Screen-only nav */}
      <div className="print:hidden mb-5 flex items-center justify-between">
        <Link href="/ads" className="text-sm text-gray-400 hover:text-gray-600">← Ad Library</Link>
        <button onClick={() => window.print()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          Print / Export PDF
        </button>
      </div>

      {/* Report header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5 print:border-0 print:p-0 print:mb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">Campaign Performance Report</p>
            <h1 className="text-3xl font-black text-gray-900">{brandName}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {ads.length} campaign{ads.length !== 1 ? 's' : ''} · Prepared by Lifted Reach · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="text-right print:hidden">
            <p className="text-xs text-gray-400">Lifted Reach</p>
          </div>
        </div>
      </div>

      {ads.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No campaigns found for <strong>{brandName}</strong>.</p>
          <Link href="/ads" className="mt-2 inline-block text-indigo-600 text-sm font-medium hover:underline">Back to Ad Library →</Link>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Total Views', value: fmtNum(totalViews) },
              { label: 'Avg Engagement Rate', value: avgER.toFixed(2) + '%' },
              { label: 'Overall ER', value: overallER.toFixed(2) + '%', sub: 'combined' },
              { label: 'Total Engagements', value: fmtNum(totalEngagements) },
              { label: 'Total Likes', value: fmtNum(totalLikes) },
              { label: 'Total Shares', value: fmtNum(totalShares) },
              { label: 'Total Saves', value: fmtNum(totalSaves) },
              ...(totalSpend > 0 ? [{ label: 'Total Ad Spend', value: `£${totalSpend.toLocaleString('en-GB')}` }] : []),
              ...(totalReach > 0 ? [{ label: 'Total Reach', value: fmtNum(totalReach) }] : []),
            ].map(s => (
              <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Best performer callout */}
          {bestAd && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-5">
              <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wide mb-1">Top Performer</p>
              <p className="font-bold text-indigo-800">{bestAd.title}</p>
              <p className="text-sm text-indigo-600 mt-0.5">
                {fmtNum(bestAd.views)} views · {er(bestAd).toFixed(2)}% engagement rate
                {bestAd.creator_name && ` · ${bestAd.creator_name}`}
              </p>
            </div>
          )}

          {/* Individual campaigns */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Campaign Breakdown</h2>
            {ads.map((ad, i) => {
              const adER = er(ad);
              return (
                <div key={ad.id} className="bg-white border border-gray-200 rounded-xl p-5 print:break-inside-avoid">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-400 font-medium">#{i + 1}</span>
                        <h3 className="font-bold text-gray-900">{ad.title}</h3>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${erBadge(adER)}`}>
                          {erLabel(adER)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {ad.creator_name && `Creator: ${ad.creator_name}`}
                        {ad.creator_name && ad.campaign_date && ' · '}
                        {ad.campaign_date && `Date: ${new Date(ad.campaign_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                        {ad.niche && ` · ${ad.niche}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-black text-gray-900">{adER.toFixed(2)}%</p>
                      <p className="text-xs text-gray-400">eng. rate</p>
                    </div>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {[
                      { label: 'Views', value: fmtNum(ad.views) },
                      { label: 'Likes', value: fmtNum(ad.likes) },
                      { label: 'Comments', value: fmtNum(ad.comments) },
                      { label: 'Shares', value: fmtNum(ad.shares) },
                      { label: 'Saves', value: fmtNum(ad.saves) },
                      ...(ad.reach ? [{ label: 'Reach', value: fmtNum(ad.reach) }] : []),
                      ...(ad.profile_visits ? [{ label: 'Profile Visits', value: fmtNum(ad.profile_visits) }] : []),
                      ...(ad.follows ? [{ label: 'New Follows', value: fmtNum(ad.follows) }] : []),
                      ...(ad.ad_spend ? [{ label: 'Ad Spend', value: `£${ad.ad_spend.toLocaleString('en-GB')}` }] : []),
                      ...(ad.clicks ? [{ label: 'Clicks', value: fmtNum(ad.clicks) }] : []),
                    ].map(m => (
                      <div key={m.label} className="bg-gray-50 rounded-lg p-2.5">
                        <p className="text-base font-bold text-gray-800">{m.value}</p>
                        <p className="text-xs text-gray-400">{m.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Rate breakdown */}
                  {ad.views > 0 && (
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-0.5">
                      {[
                        { label: 'Like rate', v: (ad.likes / ad.views * 100).toFixed(2) },
                        { label: 'Share rate', v: (ad.shares / ad.views * 100).toFixed(2) },
                        { label: 'Save rate', v: (ad.saves / ad.views * 100).toFixed(2) },
                        { label: 'Comment rate', v: (ad.comments / ad.views * 100).toFixed(2) },
                      ].map(r => (
                        <span key={r.label} className="text-xs text-gray-400">{r.label}: <strong className="text-gray-600">{r.v}%</strong></span>
                      ))}
                    </div>
                  )}

                  {ad.notes && (
                    <p className="mt-3 text-xs text-gray-500 italic border-t border-gray-100 pt-3">{ad.notes}</p>
                  )}

                  {ad.tiktok_url && (
                    <a href={ad.tiktok_url} target="_blank" rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs text-indigo-500 hover:underline print:hidden">
                      View on TikTok ↗
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          {/* Report footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-400">
              Report generated by Lifted Reach · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p className="text-xs text-gray-300 mt-0.5">Engagement Rate = (Likes + Comments + Shares + Saves) / Views × 100</p>
          </div>
        </>
      )}
    </div>
  );
}
