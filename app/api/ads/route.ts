import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const brand = searchParams.get('brand');
  const db = getDb();
  const ads = brand
    ? db.prepare('SELECT * FROM tiktok_ads WHERE brand_name = ? ORDER BY campaign_date DESC, created_at DESC').all(brand)
    : db.prepare('SELECT * FROM tiktok_ads ORDER BY campaign_date DESC, created_at DESC').all();
  return NextResponse.json(ads);
}

export async function POST(req: Request) {
  const formData = await req.formData();

  const title = (formData.get('title') as string)?.trim();
  const brand_name = (formData.get('brand_name') as string)?.trim();
  if (!title || !brand_name) {
    return NextResponse.json({ error: 'title and brand_name are required' }, { status: 400 });
  }

  const creator_name = (formData.get('creator_name') as string)?.trim() ?? '';
  const tiktok_url = (formData.get('tiktok_url') as string)?.trim() ?? '';
  const campaign_date = (formData.get('campaign_date') as string)?.trim() ?? '';
  const niche = (formData.get('niche') as string)?.trim() ?? '';
  const notes = (formData.get('notes') as string)?.trim() ?? '';

  const toInt = (key: string) => parseInt(formData.get(key) as string) || 0;
  const views = toInt('views');
  const likes = toInt('likes');
  const comments = toInt('comments');
  const shares = toInt('shares');
  const saves = toInt('saves');
  const reach = toInt('reach');
  const impressions = toInt('impressions');
  const profile_visits = toInt('profile_visits');
  const follows = toInt('follows');
  const ad_spend = toInt('ad_spend');
  const clicks = toInt('clicks');

  let video_filename = '';
  const videoFile = formData.get('video') as File | null;
  if (videoFile && videoFile.size > 0) {
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'ads');
    if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
    const safeName = videoFile.name.replace(/[^a-z0-9._-]/gi, '_').toLowerCase();
    video_filename = `${Date.now()}-${safeName}`;
    const buffer = Buffer.from(await videoFile.arrayBuffer());
    writeFileSync(join(uploadsDir, video_filename), buffer);
  }

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO tiktok_ads
      (title, brand_name, creator_name, tiktok_url, video_filename, campaign_date,
       views, likes, comments, shares, saves, reach, impressions, profile_visits,
       follows, ad_spend, clicks, niche, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title, brand_name, creator_name, tiktok_url, video_filename, campaign_date,
    views, likes, comments, shares, saves, reach, impressions, profile_visits,
    follows, ad_spend, clicks, niche, notes,
  );

  const ad = db.prepare('SELECT * FROM tiktok_ads WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(ad, { status: 201 });
}
