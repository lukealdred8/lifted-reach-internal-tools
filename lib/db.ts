import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'revenue.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_name TEXT NOT NULL,
      website TEXT,
      contact_name TEXT,
      contact_email TEXT,
      country TEXT DEFAULT 'UK',
      platform TEXT DEFAULT 'Instagram',
      notes TEXT,
      status TEXT DEFAULT 'Lead',
      score INTEGER DEFAULT 0,
      score_breakdown TEXT DEFAULT '{}',
      estimated_deal_size INTEGER DEFAULT 0,
      close_probability INTEGER DEFAULT 0,
      expected_value INTEGER DEFAULT 0,
      pricing_tiers TEXT DEFAULT '[]',
      creator_matches TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      instantly_lead_id TEXT,
      email_status TEXT DEFAULT 'not_sent',
      email_sent_at TEXT,
      replied_at TEXT
    );

    CREATE TABLE IF NOT EXISTS creators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      handle TEXT NOT NULL,
      platform TEXT NOT NULL,
      niche TEXT NOT NULL,
      followers INTEGER DEFAULT 0,
      avg_views INTEGER DEFAULT 0,
      rate_per_post INTEGER DEFAULT 0,
      audience_uk_pct INTEGER DEFAULT 70
    );

    CREATE TABLE IF NOT EXISTS tiktok_ads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      brand_name TEXT NOT NULL,
      creator_name TEXT DEFAULT '',
      tiktok_url TEXT DEFAULT '',
      video_filename TEXT DEFAULT '',
      campaign_date TEXT DEFAULT '',
      views INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      saves INTEGER DEFAULT 0,
      reach INTEGER DEFAULT 0,
      impressions INTEGER DEFAULT 0,
      profile_visits INTEGER DEFAULT 0,
      follows INTEGER DEFAULT 0,
      ad_spend INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      niche TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tiktok_creators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      handle TEXT NOT NULL,
      bio TEXT DEFAULT '',
      location TEXT DEFAULT 'UK',
      age INTEGER DEFAULT 0,
      gender TEXT DEFAULT 'female',
      followers INTEGER DEFAULT 0,
      avg_views INTEGER DEFAULT 0,
      avg_likes INTEGER DEFAULT 0,
      avg_comments INTEGER DEFAULT 0,
      engagement_rate REAL DEFAULT 0,
      niches TEXT DEFAULT '[]',
      audience_age_18_24 INTEGER DEFAULT 0,
      audience_age_25_34 INTEGER DEFAULT 0,
      audience_female_pct INTEGER DEFAULT 0,
      audience_uk_pct INTEGER DEFAULT 0,
      audience_us_pct INTEGER DEFAULT 0,
      rate_per_post INTEGER DEFAULT 0,
      tiktok_url TEXT DEFAULT '',
      verified INTEGER DEFAULT 0,
      added_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Seed tiktok_creators if empty
  const tcCount = (db.prepare('SELECT COUNT(*) as c FROM tiktok_creators').get() as { c: number }).c;
  if (tcCount === 0) {
    const tcInsert = db.prepare(`
      INSERT INTO tiktok_creators
        (name, handle, bio, location, age, gender, followers, avg_views, avg_likes, avg_comments,
         engagement_rate, niches, audience_age_18_24, audience_age_25_34, audience_female_pct,
         audience_uk_pct, audience_us_pct, rate_per_post, tiktok_url, verified)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);
    const seedTikTok: (string | number)[][] = [
      ['Mia Thompson', '@miathompson', 'Skincare & beauty lover from London 💄', 'UK', 24, 'female', 320000, 95000, 28000, 1200, 8.7, '["beauty","skincare"]', 45, 32, 78, 72, 15, 1800, '', 0],
      ['Jake Rivers', '@jakeriverstv', 'Fitness & nutrition tips 💪 Manchester', 'UK', 28, 'male', 180000, 55000, 12000, 800, 6.2, '["fitness","wellness"]', 38, 40, 42, 68, 18, 1200, '', 0],
      ['Zoe Carter', '@zoecarter', 'Fashion & GRWM content ✨ London', 'UK', 22, 'female', 210000, 75000, 18000, 950, 7.8, '["fashion","lifestyle"]', 52, 28, 82, 74, 12, 1400, '', 0],
      ['Lily Patel', '@lilypatel', 'Makeup tutorials & honest reviews 💅', 'UK', 26, 'female', 480000, 140000, 42000, 2100, 9.2, '["beauty","makeup"]', 48, 30, 85, 65, 20, 2800, '', 1],
      ['Tom Bradley', '@tombradleyfood', 'Home cooking & recipe ideas 🍳 Birmingham', 'UK', 31, 'male', 95000, 32000, 7500, 620, 7.5, '["food","lifestyle"]', 28, 42, 58, 78, 10, 800, '', 0],
      ['Amara Jones', '@amarajones', 'Fashion & culture 🌍 Leeds', 'UK', 25, 'female', 155000, 48000, 14000, 780, 8.1, '["fashion","culture"]', 50, 30, 76, 70, 16, 1100, '', 0],
      ['Ryan Cole', '@ryancolefitness', 'PT & gym content 🏋️ Glasgow', 'UK', 27, 'male', 72000, 22000, 5200, 380, 5.9, '["fitness","sports"]', 42, 38, 48, 80, 8, 600, '', 0],
      ['Priya Sharma', '@priyasharma', 'South Asian fashion & culture 🌸 Leicester', 'UK', 26, 'female', 128000, 42000, 11000, 860, 8.8, '["fashion","culture","lifestyle"]', 48, 34, 80, 76, 12, 1000, '', 0],
      ['Luca Ferrari', '@lucaferrari', 'Gaming & tech content 🎮 London', 'UK', 21, 'male', 340000, 125000, 42000, 3200, 11.9, '["gaming","tech"]', 62, 24, 32, 60, 25, 2500, '', 0],
      ['Grace Kim', '@gracekimlife', 'Home décor & interiors inspiration 🏡 Bristol', 'UK', 34, 'female', 88000, 26000, 7200, 480, 7.6, '["home","lifestyle"]', 22, 45, 82, 82, 10, 750, '', 0],
      ['Nia Davies', '@niadavies', 'Parenting & family life 👶 Cardiff', 'UK', 29, 'female', 62000, 18000, 4800, 520, 8.3, '["parenting","lifestyle"]', 18, 50, 88, 85, 8, 550, '', 0],
      ['Max Turner', '@maxturnermusic', 'Original music & covers 🎵 Manchester', 'UK', 22, 'male', 195000, 68000, 22000, 1800, 11.2, '["music","lifestyle"]', 55, 28, 60, 65, 22, 1500, '', 0],
      ['Sophie Barker', '@sophiebarker', 'Pet content & proud dog mum 🐾 Edinburgh', 'UK', 27, 'female', 145000, 55000, 18000, 1400, 12.5, '["pets","lifestyle"]', 38, 38, 74, 78, 14, 1100, '', 0],
      ['Alex Morgan', '@alexmorganfit', 'Running & marathon training 🏃 London', 'UK', 30, 'male', 55000, 16000, 3800, 340, 6.7, '["sports","fitness","wellness"]', 30, 45, 52, 76, 14, 500, '', 0],
      ['Ava Rodriguez', '@avarodriguez', 'Travel & adventure content 🌍 LA based', 'US', 29, 'female', 650000, 220000, 65000, 3200, 10.4, '["travel","lifestyle"]', 40, 38, 72, 18, 58, 4500, '', 1],
      ['Marcus Chen', '@marcustechreviews', 'Tech reviews & unboxings 📱 NYC', 'US', 32, 'male', 420000, 180000, 38000, 2800, 9.3, '["tech","gaming"]', 35, 45, 28, 15, 62, 3200, '', 1],
      ['Emma Sullivan', '@emmasullivan', 'Mental health & wellness advocate 🧠 NYC', 'US', 27, 'female', 285000, 88000, 32000, 2400, 11.6, '["mental health","wellness"]', 44, 36, 82, 14, 65, 2200, '', 0],
      ['Jordan Hayes', '@jordanhayes', 'Comedy & relatable content 😂 LA', 'US', 23, 'non-binary', 1200000, 450000, 120000, 8500, 10.8, '["comedy","lifestyle"]', 58, 28, 65, 12, 70, 8000, '', 1],
      ['Sara Al-Rashid', '@saraalrashid', 'Luxury lifestyle & fashion 💎 Dubai', 'UAE', 28, 'female', 380000, 120000, 35000, 1800, 9.8, '["fashion","luxury","lifestyle"]', 36, 44, 74, 22, 25, 3500, '', 1],
      ['Khalid Mansour', '@khalidmansour', 'Food & restaurant reviews 🍽️ Dubai', 'UAE', 30, 'male', 145000, 45000, 9500, 720, 7.1, '["food","travel"]', 32, 40, 52, 20, 18, 1500, '', 0],
      ['Chloe Wilson', '@chliewilson', 'Fitness & healthy living 🏃 Sydney', 'Australia', 25, 'female', 215000, 72000, 16000, 1100, 7.9, '["fitness","wellness","food"]', 46, 34, 79, 16, 22, 1600, '', 0],
      ['Noah Campbell', '@noahcampbell', 'Surfing & outdoor adventures 🏄 Gold Coast', 'Australia', 24, 'male', 98000, 35000, 7200, 580, 7.4, '["sports","travel","lifestyle"]', 48, 32, 45, 18, 30, 900, '', 0],
      ['Isabella Nguyen', '@isabellanguyen', 'Beauty & skincare routines 💆 Toronto', 'Canada', 23, 'female', 165000, 52000, 14000, 920, 8.5, '["beauty","skincare"]', 50, 30, 88, 18, 42, 1300, '', 0],
      ['Ethan Forrest', '@ethanforrest', 'Personal finance & investing 💰 Vancouver', 'Canada', 33, 'male', 88000, 28000, 6800, 1200, 9.1, '["finance","lifestyle"]', 28, 48, 38, 12, 48, 800, '', 0],
      ['Freya Lindqvist', '@freyalindqvist', 'Sustainable fashion & eco living 🌱 London', 'UK', 25, 'female', 112000, 38000, 10500, 920, 9.4, '["fashion","lifestyle","wellness"]', 44, 36, 84, 74, 14, 950, '', 0],
    ];
    const insertManyTc = db.transaction((rows: (string | number)[][]) => {
      for (const row of rows) tcInsert.run(row);
    });
    insertManyTc(seedTikTok);
  }

  // Migrate existing DBs — add email tracking columns if missing
  const leadCols = (db.prepare("PRAGMA table_info(leads)").all() as { name: string }[]).map(c => c.name);
  if (!leadCols.includes('instantly_lead_id')) db.exec("ALTER TABLE leads ADD COLUMN instantly_lead_id TEXT");
  if (!leadCols.includes('email_status')) db.exec("ALTER TABLE leads ADD COLUMN email_status TEXT DEFAULT 'not_sent'");
  if (!leadCols.includes('email_sent_at')) db.exec("ALTER TABLE leads ADD COLUMN email_sent_at TEXT");
  if (!leadCols.includes('replied_at')) db.exec("ALTER TABLE leads ADD COLUMN replied_at TEXT");

  // Seed creators if empty
  const count = (db.prepare('SELECT COUNT(*) as c FROM creators').get() as { c: number }).c;
  if (count === 0) {
    const insert = db.prepare(`
      INSERT INTO creators (name, handle, platform, niche, followers, avg_views, rate_per_post, audience_uk_pct)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const seedCreators = [
      ['Sophia Ellis', '@sophiaellis', 'Instagram', 'fashion', 180000, 12000, 1200, 85],
      ['Mia Thompson', '@miathompson', 'TikTok', 'beauty', 320000, 95000, 1800, 78],
      ['Ella Richards', '@ellarichards', 'Instagram', 'lifestyle', 95000, 7000, 750, 90],
      ['Zoe Carter', '@zoecarter', 'TikTok', 'fashion', 210000, 75000, 1400, 82],
      ['Hannah Brooks', '@hannahbrooks', 'YouTube', 'beauty', 145000, 35000, 2200, 75],
      ['Imogen Walsh', '@imogenwalsh', 'Instagram', 'lifestyle', 62000, 4500, 500, 92],
      ['Lily Patel', '@lilypatel', 'TikTok', 'beauty', 480000, 140000, 2800, 71],
      ['Chloe Martin', '@chloemartin', 'Instagram', 'fashion', 230000, 18000, 1600, 88],
      ['Grace Kim', '@gracekim', 'YouTube', 'lifestyle', 88000, 22000, 1800, 80],
      ['Amara Jones', '@amarajones', 'TikTok', 'fashion', 155000, 48000, 1100, 83],
      ['Ruby Shaw', '@rubyshaw', 'Instagram', 'beauty', 74000, 5500, 600, 91],
      ['Natalie Hughes', '@nataliehughes', 'Instagram', 'lifestyle', 120000, 9500, 900, 86],
    ];
    const insertMany = db.transaction((rows: (string | number)[][]) => {
      for (const row of rows) insert.run(row);
    });
    insertMany(seedCreators);
  }
}
