# VidDL — Free Video Downloader

Download videos from YouTube, TikTok, Instagram, Twitter/X, Facebook, Reddit, Vimeo and 1000+ sites. No watermark, no limits, no API key needed.

**Powered by [yt-dlp](https://github.com/yt-dlp/yt-dlp)**

---

## Features

- High quality downloads (up to 4K where available)
- No watermark
- Video + Audio-only formats
- 1000+ supported sites
- Clean dark UI
- Self-hosted on Vercel (free tier)

---

## Deploy to Vercel (Step-by-Step)

### Step 1 — Fork / Push to GitHub

1. Create a new repo on [github.com/new](https://github.com/new)
2. Clone it locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/viddl.git
   cd viddl
   ```
3. Copy all these project files in, then:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

### Step 2 — Install yt-dlp on Vercel

Vercel runs Node.js serverless functions. `yt-dlp-exec` (npm package) automatically downloads the yt-dlp binary for the platform it's running on — **no manual install needed**.

### Step 3 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Framework preset: **Other**
4. Root directory: `.` (leave default)
5. Click **Deploy**

That's it. Vercel auto-detects `vercel.json` and deploys:
- `/api/info.js` → serverless function at `yourdomain.vercel.app/api/info`
- `/api/download.js` → serverless function at `yourdomain.vercel.app/api/download`
- `/public/` → static frontend

### Step 4 — Optional: Custom Domain

In Vercel dashboard → Project → Settings → Domains → Add your domain.

---

## Run Locally

```bash
npm install
npm run dev
# Open http://localhost:3000
```

> For local dev, the API functions need a local server. Use `vercel dev` instead:
> ```bash
> npm install -g vercel
> vercel dev
> ```

---

## Project Structure

```
viddl/
├── api/
│   ├── info.js         # POST /api/info — fetch video metadata
│   └── download.js     # POST /api/download — stream video to browser
├── public/
│   ├── index.html      # Main frontend
│   ├── favicon.svg
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── vercel.json         # Vercel routing config
├── package.json
└── .gitignore
```

---

## How It Works

1. User pastes a URL → frontend calls `POST /api/info`
2. Server runs `yt-dlp --dump-json <url>` → returns all available formats
3. User picks a format → frontend calls `POST /api/download`
4. Server runs `yt-dlp -f <format_id> -o - <url>` → pipes the video stream directly to the browser
5. Browser triggers a file download

---

## Important Notes

- **Vercel free tier** has a 10-second function timeout. Long videos may time out during streaming. For large files, consider upgrading to Vercel Pro (60s timeout) or self-hosting on a VPS.
- This is for **personal use only**. Downloading copyrighted content without permission may violate terms of service.
- yt-dlp is updated frequently. To keep it current, periodically update the `yt-dlp-exec` package: `npm update yt-dlp-exec`

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Function timeout" on large videos | Use Vercel Pro or a VPS |
| "yt-dlp not found" | Run `npm install` again |
| YouTube gives errors | Update yt-dlp: `npm update yt-dlp-exec` |
| CORS error | You're testing outside Vercel — use `vercel dev` locally |

---

## License

MIT — do whatever you want, personal use only.
