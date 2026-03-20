export interface Lead {
  id?: number;
  brand_name: string;
  website?: string;
  contact_name?: string;
  contact_email?: string;
  country?: string;
  platform?: string;
  notes?: string;
  status?: string;
}

export interface ScoreBreakdown {
  uk_relevance: number;
  brand_fit: number;
  budget_level: number;
  social_presence: number;
  campaign_likelihood: number;
  total: number;
  reasons: string[];
}

const UK_COUNTRIES = ['uk', 'united kingdom', 'england', 'scotland', 'wales', 'northern ireland'];
const FASHION_KEYWORDS = ['fashion', 'clothing', 'apparel', 'style', 'wear', 'dress', 'outfit', 'brand', 'boutique', 'luxury', 'accessories'];
const BEAUTY_KEYWORDS = ['beauty', 'cosmetic', 'makeup', 'skincare', 'skin care', 'hair', 'nail', 'wellness', 'spa', 'fragrance', 'parfum', 'serum'];
const LIFESTYLE_KEYWORDS = ['lifestyle', 'fitness', 'health', 'travel', 'food', 'drink', 'home', 'interior', 'jewellery', 'jewelry', 'watch', 'sport'];
const HIGH_BUDGET_SIGNALS = ['luxury', 'premium', 'global', 'international', 'plc', 'group', 'holdings', 'london'];
const MID_BUDGET_SIGNALS = ['boutique', 'studio', 'brand', 'label', 'co.', 'limited', 'ltd'];
const INFLUENCER_FRIENDLY = ['influencer', 'creator', 'collab', 'ambassador', 'ugc', 'affiliate', 'campaign', 'partnership'];

export function scoreLead(lead: Lead): ScoreBreakdown {
  const reasons: string[] = [];
  const country = (lead.country || '').toLowerCase();
  const notes = (lead.notes || '').toLowerCase();
  const brandName = (lead.brand_name || '').toLowerCase();
  const website = (lead.website || '').toLowerCase();
  const allText = `${brandName} ${website} ${notes}`;

  // UK Relevance (0-20)
  let ukRelevance = 0;
  if (UK_COUNTRIES.some(c => country.includes(c))) {
    ukRelevance = 20;
    reasons.push('UK-based brand — top audience match for our creators');
  } else if (country === 'eu' || ['france', 'germany', 'italy', 'spain', 'netherlands'].some(c => country.includes(c))) {
    ukRelevance = 12;
    reasons.push('European brand — decent UK creator alignment');
  } else if (country === 'us' || country === 'usa' || country === 'united states') {
    ukRelevance = 8;
    reasons.push('US brand — UK creators can work but audience overlap is lower');
  } else if (country) {
    ukRelevance = 5;
    reasons.push('Non-UK brand — audience relevance may be limited');
  } else {
    ukRelevance = 10;
    reasons.push('Country unknown — assuming partial UK relevance');
  }

  // Brand Fit (0-25)
  let brandFit = 0;
  const isFashion = FASHION_KEYWORDS.some(k => allText.includes(k));
  const isBeauty = BEAUTY_KEYWORDS.some(k => allText.includes(k));
  const isLifestyle = LIFESTYLE_KEYWORDS.some(k => allText.includes(k));
  const matchCount = [isFashion, isBeauty, isLifestyle].filter(Boolean).length;

  if (matchCount >= 2) {
    brandFit = 25;
    reasons.push('Excellent brand fit — matches multiple niches (fashion/beauty/lifestyle)');
  } else if (isFashion) {
    brandFit = 22;
    reasons.push('Strong fashion brand fit — core niche for our creators');
  } else if (isBeauty) {
    brandFit = 22;
    reasons.push('Strong beauty brand fit — high demand niche');
  } else if (isLifestyle) {
    brandFit = 18;
    reasons.push('Good lifestyle brand fit — broad creator appeal');
  } else {
    brandFit = 8;
    reasons.push('Brand niche unclear — may need qualification call');
  }

  // Budget Level (0-20)
  let budgetLevel = 0;
  const isHighBudget = HIGH_BUDGET_SIGNALS.some(k => allText.includes(k));
  const isMidBudget = MID_BUDGET_SIGNALS.some(k => allText.includes(k));
  if (isHighBudget) {
    budgetLevel = 20;
    reasons.push('High-budget signals detected — premium/luxury indicators');
  } else if (isMidBudget) {
    budgetLevel = 13;
    reasons.push('Mid-budget signals — established brand structure');
  } else {
    budgetLevel = 7;
    reasons.push('Budget signals unclear — verify on discovery call');
  }

  // Social Presence (0-20)
  let socialPresence = 0;
  const platform = (lead.platform || '').toLowerCase();
  if (platform.includes('tiktok') && platform.includes('instagram')) {
    socialPresence = 20;
    reasons.push('Multi-platform focus — TikTok + IG = high reach potential');
  } else if (platform.includes('tiktok')) {
    socialPresence = 18;
    reasons.push('TikTok focus — highest organic reach platform right now');
  } else if (platform.includes('instagram')) {
    socialPresence = 15;
    reasons.push('Instagram focus — solid engagement platform');
  } else if (platform.includes('youtube')) {
    socialPresence = 14;
    reasons.push('YouTube focus — long-form, high trust platform');
  } else {
    socialPresence = 8;
    reasons.push('Platform focus unclear — clarify to size deal accurately');
  }

  // Campaign Likelihood (0-15)
  let campaignLikelihood = 0;
  const hasInfluencerSignals = INFLUENCER_FRIENDLY.some(k => notes.includes(k));
  const hasEmail = !!(lead.contact_email && lead.contact_email.includes('@'));
  const hasContact = !!(lead.contact_name);

  if (hasInfluencerSignals) {
    campaignLikelihood += 8;
    reasons.push('Notes suggest active influencer marketing interest');
  }
  if (hasEmail && hasContact) {
    campaignLikelihood += 7;
    reasons.push('Direct contact details provided — warm lead signals');
  } else if (hasEmail || hasContact) {
    campaignLikelihood += 4;
    reasons.push('Partial contact info — follow up to qualify');
  }
  if (!hasInfluencerSignals && !hasEmail && !hasContact) {
    campaignLikelihood = 5;
    reasons.push('No strong buying signals yet — needs qualification');
  }

  const total = ukRelevance + brandFit + budgetLevel + socialPresence + campaignLikelihood;

  return {
    uk_relevance: ukRelevance,
    brand_fit: brandFit,
    budget_level: budgetLevel,
    social_presence: socialPresence,
    campaign_likelihood: campaignLikelihood,
    total,
    reasons,
  };
}

export interface DealIntelligence {
  estimated_deal_size: number;
  close_probability: number;
  expected_value: number;
}

export function calculateDealIntelligence(score: number, platform: string, notes: string): DealIntelligence {
  const allText = `${platform} ${notes}`.toLowerCase();

  // Base deal size from score
  let baseDeal = 0;
  if (score >= 80) baseDeal = 8000;
  else if (score >= 65) baseDeal = 5000;
  else if (score >= 50) baseDeal = 3000;
  else if (score >= 35) baseDeal = 1500;
  else baseDeal = 800;

  // Adjust for platform complexity
  const isMultiPlatform = (allText.includes('tiktok') && allText.includes('instagram')) ||
    (allText.includes('youtube') && allText.includes('instagram'));
  if (isMultiPlatform) baseDeal = Math.round(baseDeal * 1.4);

  // Close probability from score
  let closeProbability = 0;
  if (score >= 80) closeProbability = 75;
  else if (score >= 65) closeProbability = 55;
  else if (score >= 50) closeProbability = 35;
  else if (score >= 35) closeProbability = 20;
  else closeProbability = 8;

  const expectedValue = Math.round((baseDeal * closeProbability) / 100);

  return {
    estimated_deal_size: baseDeal,
    close_probability: closeProbability,
    expected_value: expectedValue,
  };
}

export interface PricingTier {
  name: string;
  label: string;
  creators: number;
  deliverables: string;
  price: number;
  profit: number;
  margin: number;
}

export function generatePricingTiers(score: number, platform: string): PricingTier[] {
  const p = (platform || '').toLowerCase();
  const isTikTok = p.includes('tiktok');
  const isYouTube = p.includes('youtube');
  const isMulti = (isTikTok && p.includes('instagram')) || p.includes(',');

  // Base prices scale with score
  const multiplier = score >= 70 ? 1.3 : score >= 50 ? 1.0 : 0.75;

  const low: PricingTier = {
    name: 'low',
    label: 'Quick Win',
    creators: 1,
    deliverables: isTikTok
      ? '2x TikTok videos + story mention'
      : isYouTube
      ? '1x YouTube integration (60s)'
      : '2x Instagram Reels + 3x Stories',
    price: Math.round(1200 * multiplier / 100) * 100,
    profit: 0,
    margin: 40,
  };

  const mid: PricingTier = {
    name: 'mid',
    label: 'Standard Package',
    creators: 3,
    deliverables: isMulti
      ? '3x TikTok videos + 3x Reels + story content'
      : isTikTok
      ? '3x creators — 2 TikToks each + 1 story'
      : '3x creators — 2 Reels each + 3 Stories each',
    price: Math.round(3500 * multiplier / 100) * 100,
    profit: 0,
    margin: 42,
  };

  const premium: PricingTier = {
    name: 'premium',
    label: 'Premium Bundle',
    creators: 6,
    deliverables: '6x creators across TikTok + IG — full content calendar, 30-day campaign, usage rights',
    price: Math.round(7500 * multiplier / 100) * 100,
    profit: 0,
    margin: 45,
  };

  // Calculate profits
  [low, mid, premium].forEach(tier => {
    tier.profit = Math.round((tier.price * tier.margin) / 100);
  });

  return [low, mid, premium];
}

export interface Creator {
  id: number;
  name: string;
  handle: string;
  platform: string;
  niche: string;
  followers: number;
  avg_views: number;
  rate_per_post: number;
  audience_uk_pct: number;
}

export function matchCreators(creators: Creator[], platform: string, notes: string, brandFit: number): Creator[] {
  const allText = `${platform} ${notes}`.toLowerCase();
  const isFashion = FASHION_KEYWORDS.some(k => allText.includes(k));
  const isBeauty = BEAUTY_KEYWORDS.some(k => allText.includes(k));
  const isLifestyle = LIFESTYLE_KEYWORDS.some(k => allText.includes(k));
  const wantsTikTok = allText.includes('tiktok');
  const wantsIG = allText.includes('instagram') || allText.includes('ig');
  const wantsYT = allText.includes('youtube') || allText.includes('yt');

  const scored = creators.map(c => {
    let score = 0;
    // Niche match
    if (isFashion && c.niche === 'fashion') score += 40;
    if (isBeauty && c.niche === 'beauty') score += 40;
    if (isLifestyle && c.niche === 'lifestyle') score += 30;
    // Platform match
    if (wantsTikTok && c.platform === 'TikTok') score += 25;
    if (wantsIG && c.platform === 'Instagram') score += 25;
    if (wantsYT && c.platform === 'YouTube') score += 25;
    // UK audience bonus
    score += Math.round(c.audience_uk_pct / 10);
    return { ...c, match_score: score };
  });

  return scored
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 4) as unknown as Creator[];
}
