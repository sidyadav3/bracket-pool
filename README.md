# 🏀 Price Family March Madness Pool 2026

A real-time bracket pool web app for the 2026 NCAA Tournament. Built with React, Supabase, and deployed on Vercel.

**Live site:** [pricemadness.com](https://pricemadness.com)

## Features

- **Fill out brackets** — pick winners through all 63 games
- **Live leaderboard** — auto-scores with custom 1-2-4-6-8-10 point system
- **Max possible tracker** — see how many points each player can still earn
- **Real-time sync** — all players see the same data instantly via Supabase
- **Admin controls** — PIN-protected access for editing brackets, entering results, and managing data
- **Export/Import** — back up and restore all pool data
- **Mobile friendly** — works on any device

## Scoring

| Round | R64 | R32 | Sweet 16 | Elite 8 | Final Four | Championship |
|-------|-----|-----|----------|---------|------------|--------------|
| Points | 1 | 2 | 4 | 6 | 8 | 10 |

**Max possible: 146 points**

## Tech Stack

- **Frontend:** React + Vite
- **Database:** Supabase (PostgreSQL)
- **Hosting:** Vercel
- **Domain:** pricemadness.com

## Local Development

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`

## © 2026 Sid Yadav
