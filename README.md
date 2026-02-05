# AgentScore MVP Website

A simple MVP landing page for AgentScore - a Cyprus real estate agent review platform.

## Files

- `index.html` - Homepage with hero, search, city filters, and featured agents
- `agents.html` - Agent listing page with filters, search, and pagination
- `agent-profile.html` - Individual agent profile with mock reviews
- `js/data.js` - Data loading and processing (loads from `../collected-agents.json`)
- `js/app.js` - Shared utilities (star rendering, helpers)

## Features

✅ Modern, clean design using Tailwind CSS (via CDN)
✅ Responsive mobile-first layout
✅ Homepage with:
  - Hero section with search
  - Quick city filter buttons (Limassol, Nicosia, Paphos, Larnaca, Famagusta)
  - Featured agents section (top 6 by listing count)
  - City cards with agent counts

✅ Agent listing page:
  - Search by agency name
  - Filter by city
  - Filter by minimum rating
  - Sort by rating, listings, or name
  - Grid/List view toggle
  - Pagination

✅ Agent profile page:
  - Agency header with rating and info
  - Mock reviews (generated from rating data)
  - Rating breakdown chart
  - Contact information sidebar

## Setup

1. Copy environment template:
```bash
cp .env.example .env.local
```

2. Add your Supabase credentials to `.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

⚠️ **IMPORTANT:** `.env.local` is in `.gitignore` and won't be committed. Never commit real credentials.

## Running Locally

```bash
# From the website directory
cd /Users/milton/clawd/projects/agent-scraper/website

# Start a local server
python3 -m http.server 8080

# Or with Node.js
npx serve .

# Then open http://localhost:8080
```

## Data Source

The website loads agent data from:
- **Static JSON** (MVP mode): `../collected-agents.json`
- **Supabase** (production): Uses credentials from `.env.local`

Ratings and reviews are generated algorithmically for the MVP. In production, these would come from a database with real reviews.

## Deployment

This is a static site that can be hosted anywhere:
- GitHub Pages
- Netlify
- Vercel
- Any web server

Just upload all files and ensure `collected-agents.json` is accessible at `../collected-agents.json` relative to the website files.

## Tech Stack

- **HTML5** - Semantic markup
- **Tailwind CSS** - Via CDN for styling
- **Vanilla JavaScript** - No frameworks, minimal dependencies
- **Inter font** - Via Google Fonts
