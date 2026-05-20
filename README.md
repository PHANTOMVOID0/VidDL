# VidDL 🎬

> Download videos from YouTube, TikTok, Instagram, Twitter/X, Facebook, Reddit, Vimeo and 1000+ sites — no watermark, no API key, completely free.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=flat&logo=vercel&logoColor=white)
![yt-dlp](https://img.shields.io/badge/Powered_by-yt--dlp-FF0000?style=flat)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat)

---

## Preview

```
Paste any video URL → Pick quality → Download
```

Clean dark UI · Multiple formats · Up to 4K · Audio-only option · No watermark

---

## Features

- **1000+ supported sites** — YouTube, TikTok, Instagram, Twitter/X, Facebook, Reddit, Vimeo, Dailymotion, Twitch, SoundCloud, Bilibili and more
- **High quality** — download up to 4K/1080p/720p wherever available
- **No watermark** — fetches the original source directly
- **Audio only** — extract MP3/M4A from any video
- **No API key needed** — powered by the open-source yt-dlp tool
- **Free hosting** — runs on Vercel free tier
- **Auto-updates** — just push to GitHub, Vercel redeploys automatically

---

## Project Structure

```
viddl/
├── api/
│   ├── info.js          # Serverless function — fetches video metadata & formats
│   └── download.js      # Serverless function — streams video to browser
├── public/
│   ├── index.html       # Frontend UI
│   ├── favicon.svg
│   ├── css/
│   │   └── style.css    # Styles (dark theme)
│   └── js/
│       └── app.js       # Frontend logic
├── vercel.json          # Vercel routing config
├── package.json         # Dependencies
└── .gitignore
```

---

## How It Works

```
User pastes URL
      │
      ▼
POST /api/info
      │
      ├── yt-dlp fetches all available formats
      └── Returns: title, thumbnail, formats list
                        │
                        ▼
            User picks format & clicks Download
                        │
                        ▼
               POST /api/download
                        │
                        ├── yt-dlp streams video
                        └── Browser saves the file
```

No third-party APIs. No middleman. Your server talks directly to the source.

---

## Setup & Deployment

### Requirements

- [Node.js 18+](https://nodejs.org)
- [Git](https://git-scm.com)
- [Vercel account](https://vercel.com) (free)
- [GitHub account](https://github.com) (free)

---

### Step 1 — Create the folder structure

```bash
mkdir viddl
cd viddl
mkdir api
mkdir public
mkdir public/css
mkdir public/js
```

Place the files like this:

| File | Location |
|------|----------|
| `package.json` | `viddl/package.json` |
| `vercel.json` | `viddl/vercel.json` |
| `gitignore.txt` | `viddl/.gitignore` ← add the dot, remove .txt |
| `api_info.js` | `viddl/api/info.js` ← rename |
| `api_download.js` | `viddl/api/download.js` ← rename |
| `index.html` | `viddl/public/index.html` |
| `style.css` | `viddl/public/css/style.css` |
| `app.js` | `viddl/public/js/app.js` |

---

### Step 2 — Install dependencies

```bash
npm install
```

This installs `yt-dlp-exec` which automatically downloads the yt-dlp binary — no manual installation needed.

---

### Step 3 — Test locally

Install Vercel CLI if you haven't:

```bash
npm install -g vercel
```

Run the dev server:

```bash
vercel dev
```

Open [http://localhost:3000](http://localhost:3000) and test with a YouTube URL.

---

### Step 4 — Push to GitHub

Create a new repo at [github.com/new](https://github.com/new), then:

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/viddl.git
git push -u origin main
```

---

### Step 5 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New Project**
3. Click **Import** next to your `viddl` repository
4. Settings:
   - Framework Preset → **Other**
   - Root Directory → `.` (leave as default)
5. Click **Deploy**

Your site is live at `https://viddl-yourname.vercel.app` ✅

---

### Step 6 — Future updates

Every time you change something:

```bash
git add .
git commit -m "describe your change"
git push
```

Vercel automatically redeploys. No manual steps needed.

---

## Keeping yt-dlp Updated

YouTube and other sites frequently change how they serve videos. yt-dlp releases updates to keep up. Run this every few weeks to stay current:

```bash
npm update yt-dlp-exec
git add package.json package-lock.json
git commit -m "update yt-dlp"
git push
```

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `npm install` fails | Node.js not installed | Install from [nodejs.org](https://nodejs.org) |
| `vercel dev` not found | Vercel CLI missing | `npm install -g vercel` |
| "Cannot find module" error | File renamed wrong | Check `api/info.js` and `api/download.js` exist |
| Video download times out | Vercel free tier = 10s limit | Upgrade to Vercel Pro (60s) or use a VPS |
| YouTube returns errors | yt-dlp is outdated | `npm update yt-dlp-exec` then push |
| Instagram/TikTok fails | Login required for private content | Only public videos are supported |
| "Failed to fetch video info" | Invalid or unsupported URL | Check the URL is public and try again |

---

## Vercel Free Tier Limits

| Limit | Free Tier | Pro Tier |
|-------|-----------|----------|
| Function timeout | 10 seconds | 60 seconds |
| Bandwidth | 100 GB/month | 1 TB/month |
| Deployments | Unlimited | Unlimited |

> For most short videos (under ~50MB) the free tier works fine. For longer videos, consider Vercel Pro or deploying on a VPS like Railway, Render, or a $5 DigitalOcean droplet.

---

## Supported Sites (Sample)

YouTube · TikTok · Instagram · Twitter/X · Facebook · Reddit · Vimeo · Dailymotion · Twitch · SoundCloud · Bilibili · Niconico · Rumble · Odysee · Pinterest · LinkedIn · Snapchat · and **1000+ more**

Full list: [github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML, CSS, JavaScript |
| Backend | Node.js Serverless Functions (Vercel) |
| Video engine | [yt-dlp](https://github.com/yt-dlp/yt-dlp) via [yt-dlp-exec](https://www.npmjs.com/package/yt-dlp-exec) |
| Hosting | Vercel |
| Source control | GitHub |

---

## Legal Notice

This tool is intended for **personal use only**. Only download content you have the right to download. Downloading copyrighted material without permission may violate the terms of service of the source platform and applicable copyright law. The developer is not responsible for misuse.

---

## License

MIT — free to use, modify, and distribute.

---

*Built with [yt-dlp](https://github.com/yt-dlp/yt-dlp) — the best open-source video downloader.*
