import { NextResponse } from 'next/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCreator(item: any) {
  // clockworks/tiktok-scraper returns different shapes for user search vs profile scraper
  const user = item.userInfo?.user ?? item.authorMeta ?? item;
  const stats = item.userInfo?.stats ?? item.authorStats ?? {};

  const handle = user.uniqueId ?? user.name ?? user.handle ?? '';
  const name = user.nickname ?? user.nickName ?? user.displayName ?? handle;
  const followers =
    stats.followerCount ?? user.fans ?? user.followerCount ?? 0;
  const following =
    stats.followingCount ?? user.following ?? user.followingCount ?? 0;
  const videoCount =
    stats.videoCount ?? user.video ?? user.videoCount ?? 0;
  const heartCount =
    stats.heartCount ?? stats.diggCount ?? user.digg ?? user.heart ?? 0;
  const verified = Boolean(user.verified ?? user.isVerified ?? false);
  const bio = user.signature ?? user.bio ?? user.description ?? '';
  const avatarUrl = user.avatarLarger ?? user.avatarMedium ?? user.avatar ?? '';

  // Rough engagement estimate: avg likes per video / followers
  const engagementRate =
    followers > 0 && videoCount > 0
      ? Math.min(((heartCount / videoCount) / followers) * 100, 99)
      : 0;

  return {
    name: name || handle,
    handle: handle ? (handle.startsWith('@') ? handle : `@${handle}`) : '',
    bio,
    location: '',
    age: 0,
    gender: 'female',
    followers,
    avg_views: 0,
    avg_likes: videoCount > 0 ? Math.round(heartCount / videoCount) : 0,
    avg_comments: 0,
    engagement_rate: Math.round(engagementRate * 10) / 10,
    niches: [],
    audience_age_18_24: 0,
    audience_age_25_34: 0,
    audience_female_pct: 0,
    audience_uk_pct: 0,
    audience_us_pct: 0,
    rate_per_post: 0,
    tiktok_url: handle ? `https://www.tiktok.com/@${handle.replace('@', '')}` : '',
    verified,
    avatarUrl,
    following,
    videoCount,
  };
}

export async function POST(req: Request) {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: 'APIFY_API_TOKEN is not set. Add it to your .env.local file.' },
      { status: 500 },
    );
  }

  const { query, maxResults = 20 } = await req.json();
  if (!query?.trim()) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }

  // Use clockworks/tiktok-scraper — search for users matching a keyword
  // Sync endpoint: runs the actor and returns dataset items directly (times out after 300s)
  const apifyUrl =
    `https://api.apify.com/v2/acts/clockworks~tiktok-scraper/run-sync-get-dataset-items` +
    `?token=${token}&timeout=120&memory=512`;

  const input = {
    searchQueries: [query.trim()],
    resultsType: 'users',
    maxItems: Math.min(Number(maxResults) || 20, 50),
    proxyConfiguration: { useApifyProxy: true },
  };

  let items: unknown[];
  try {
    const res = await fetch(apifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      // Node fetch signal for timeout
      signal: AbortSignal.timeout(130_000),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Apify error ${res.status}: ${text.slice(0, 300)}` },
        { status: 502 },
      );
    }

    items = await res.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Request failed: ${msg}` }, { status: 502 });
  }

  if (!Array.isArray(items)) {
    return NextResponse.json(
      { error: 'Unexpected response from Apify', raw: items },
      { status: 502 },
    );
  }

  const creators = items
    .filter((item: unknown) => {
      if (typeof item !== 'object' || item === null) return false;
      const i = item as Record<string, unknown>;
      // Filter out items with no usable handle
      const user = (i.userInfo as Record<string, unknown>)?.user ?? i.authorMeta ?? i;
      if (typeof user !== 'object' || user === null) return false;
      const u = user as Record<string, unknown>;
      return u.uniqueId ?? u.name ?? u.handle;
    })
    .map(mapCreator)
    .filter(c => c.handle && c.handle !== '@');

  return NextResponse.json(creators);
}
