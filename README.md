# Lifted Reach — Revenue System

Internal influencer revenue, lead scoring, and pipeline tool for a UK-based fashion/beauty/lifestyle creator agency.

---

## What It Does

- **Lead Input** — Add brands with contact details, country, platform focus, and notes
- **Lead Scoring** — Auto-scores each lead out of 100 across 5 dimensions
- **Deal Intelligence** — Estimates deal size, close probability, and expected value
- **Pricing Engine** — Suggests 3 pricing tiers (Low / Mid / Premium) with deliverables and profit
- **Creator Recommendations** — Matches best-fit creators from your roster to each lead
- **Pipeline Tracking** — Move leads through Lead → Contacted → Replied → Negotiating → Closed / Lost
- **Dashboard** — Live stats: pipeline value, expected revenue, close rate, average deal size

---

## How to Run Locally

### 1. Install Node.js

Download from [nodejs.org](https://nodejs.org) — use the LTS version (v18+).

Verify it's installed:
```bash
node -v
npm -v
```

### 2. Clone the repo

```bash
git clone <your-repo-url>
cd lifted-reach-internal-tools
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the app

```bash
npm run dev
```

Open your browser at **http://localhost:3000**

That's it. The SQLite database creates itself automatically in a `data/` folder on first run.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS |
| Database | SQLite via `better-sqlite3` |
| Language | TypeScript |

---

## How to Use This Daily

### Morning (5 min)
1. Open the Dashboard — check expected revenue and active deal count
2. See if anything needs moving in the pipeline

### When you find a new brand
1. Go to **+ Add Lead**
2. Fill in brand name, country, platform, and any notes you have
3. Hit **Add Lead & Score** — scoring runs instantly
4. Read the score breakdown to decide if it's worth pursuing

### Interpreting scores
- **70–100**: Prioritise immediately. Strong fit, likely budget, UK audience.
- **50–69**: Worth contacting. Qualify on a call.
- **Below 50**: Low priority. Park or skip.

### During outreach
- Move leads through the pipeline using the status buttons on each lead card
- Use the **Pricing Engine** to send accurate proposals without guessing
- Use **Creator Recommendations** to suggest specific talent in your pitch emails

### Weekly (10 min)
- Review pipeline value vs expected revenue gap — this shows where effort should go
- Move stale leads to **Lost** to keep your close rate accurate
- Check your average deal size — if it's dropping, focus on Premium tier pitches

---

## Customising Creators

Creators are seeded in `lib/db.ts`. To add your real roster, edit the `seedCreators` array in that file with your actual talent.

Each creator has:
- `name`, `handle`, `platform`, `niche`
- `followers`, `avg_views`, `rate_per_post`
- `audience_uk_pct` — what % of their audience is UK-based (0–100)
