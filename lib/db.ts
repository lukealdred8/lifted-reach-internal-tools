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
