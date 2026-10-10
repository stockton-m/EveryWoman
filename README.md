# EveryWoman

A static React website for **EveryWoman** — a women's health and fitness platform built around strength training and movement for those living with endometriosis, PCOS, pre/postpartum symptoms, and those navigating perimenopause and menopause. Founded by Madeleine Stockton.

The live site is deployed on **Netlify**. The codebase was originally generated from a Figma design using Figma Make, then customized.

---

## For a future AI agent continuing this project

### What this project is
This is a **static multi-page React website** (client-side routing). There is no backend, no database, and no server. When built, it produces a `dist/` folder of plain HTML/CSS/JS files that Netlify serves to visitors.

**Routes:**
- `/` — Home (hero, about, services teaser, latest from me)
- `/about` — Madeleine's story, influences, and personal photo collage
- `/services` — Coaching tiers and consultation CTA
- `/posts` — Recent posts and the full archive (Substack articles, Instagram, and TikTok)
- `/posts/:id` — A Substack article rendered from the content archive

### Who the author is
Madeleine Stockton is the founder and is **not technical**. She communicates changes conversationally (e.g. "make the photo smaller", "change this text to..."). All code changes should be made by the AI agent — she should never need to edit code manually.

_Note:_ There is a second author, Will Carhart, who also works on the site. He is a software engineer and is technical.

### How to get the site running locally (for development/preview)
1. Open Terminal and navigate to this folder:
   ```
   cd ~/.../EveryWoman
   ```
2. Start the local preview server:
   ```
   pnpm dev
   ```
3. Open your browser to `http://localhost:5173` to see the site. Visit `http://localhost:5173/about` for the About page or `http://localhost:5173/services` for the services page.

### How to build for deployment
```
pnpm build
```
This creates a `dist/` folder. Drag that folder onto Netlify, or deploy via the Netlify CLI:
```
npx netlify-cli deploy --dir=dist --prod
```

**Netlify SPA routing:** `public/_redirects` is copied into `dist/` on build so direct links like `/services` resolve to `index.html`.

### External content synchronization
We build static content from a single content archive file, `src/data/content-archive.json`. This is an append-only compilation of Substack, Instagram, and TikTok from the relevant EveryWoman accounts. We use this archive to build `/posts` and `/posts/:id` pages.

A GitHub Action runs once per day to update the archive. You can run it manually via `pnpm content:sync [--dry-run]`. Data sources:
* Substack: https://everywomanhealth.substack.com/feed
* Instagram: [Behold](https://behold.so/)
* TikTok: the latest successful run of the Apify task `everywoman~everywoman-tiktok` (`@everywomanhealth`, latest 50 posts). The synchronizer only reads that cached dataset. It does not start the Apify scraper.

For testing locally, create an `.env` file and set:
* `BEHOLD_FEED_URL`, which looks like `https://feeds.behold.so/YOUR_FEED_ID`. The URL itself is the only identifier Behold needs. Behold updates the feed on their backend, and the URL can be accessed by anyone. You should still treat the URL as a secret because under Behold's free tier the URL only allows 1200 views per month.
* `APIFY_TOKEN`, an Apify API token.
* `APIFY_TASK_ID`, normally `everywoman~everywoman-tiktok`. `everywoman/everywoman-tiktok` is accepted and normalized to the tilde form Apify expects.

The synchronizer performs no Git operations. It validates every source before reconciling in memory, writes once only after every provider succeeds, keeps records that are no longer in a recent-content feed, and preserves an archived Substack slug when upstream titles or URLs change. Keep in mind that additions and edits to known posts will update the archive, but deletion is manual - the compilation logic is _greedy_. When a post falls off one of the content sources, it isn't automatically deleted from the checked-in archive. A missing, failed, or expired Apify dataset fails the sync instead of being treated as an empty TikTok feed. A successful dataset older than three days logs a warning; one older than seven days (Apify's retention window) fails the sync.

After that sync, TikTok posts that do not already have `metadata.thumbnailPath` are looked up through TikTok's public oEmbed endpoint. A JPEG, PNG, or WebP thumbnail is saved at `public/tiktok/{sourceId}.ext` and that path is recorded on the post. Posts that already have a thumbnail are left alone, including when TikTok rotates the signed image URL. If a thumbnail cannot be downloaded, that post stays unchanged and `/posts` uses the existing EveryWoman logo until a later sync succeeds. `--dry-run` reports how many thumbnails are missing and does not download them.

Recommended local validation:

```bash
# Create .env and add BEHOLD_FEED_URL, APIFY_TOKEN, and APIFY_TASK_ID

# validate env
pnpm test
pnpm typecheck:content

# dry run
pnpm content:sync --dry-run
cat src/data/content-archive.json

# update for realz
pnpm content:sync
git diff -- src/data/content-archive.json public/tiktok
# if you run pnpm content:sync again within a few seconds, there should be no diff
```

See `.github/workflows/sync-content.yml` for the scheduled GitHub Action. The action commits the archive JSON and any new TikTok thumbnails when there are changes, and then a subsequent Netlify build will deploy updates to the site. GitHub needs repository secrets named `BEHOLD_FEED_URL`, `APIFY_TOKEN`, and `APIFY_TASK_ID`. Set `APIFY_TASK_ID` to `everywoman~everywoman-tiktok`.

### Where everything lives
- **Entry point:** `src/main.tsx` → renders `<App />` from `src/app/App.tsx` (React Router)
- **Pages:** `src/app/pages/HomePage.tsx`, `src/app/pages/AboutPage.tsx`, `src/app/pages/ServicesPage.tsx`, `src/app/pages/PostsPage.tsx`, `src/app/pages/PostPage.tsx`
- **Shared UI:** `src/app/components/SiteNav.tsx`, `SiteFooter.tsx`, `PortraitPlaceholder.tsx`, `TierComparisonGrid.tsx`
- **Copy / tiers:** `src/app/content/coaching.ts`, `src/app/content/articles.ts`
- **External content archive:** `src/data/content-archive.json`
- **Content synchronizer:** `scripts/content/`
- **Constants (URLs, colors):** `src/app/constants.ts`
- **Images:** `src/imports/` — `logo.png` (nav/footer) and `profile.png` (about card portrait). Services sections use `PortraitPlaceholder` until a dedicated photo is added.
- **Styles:** `src/styles/` — `index.css` imports `fonts.css`, `tailwind.css`, and `theme.css`. Brand colors are defined as CSS variables in `theme.css` and applied as inline `style` props in components.
- **Image helper:** `src/app/components/figma/ImageWithFallback.tsx` — a wrapper around `<img>` that shows a placeholder if an image fails to load.
- **Path alias:** `@` maps to `src/`

### Brand design reference
| Token | Value |
|-------|-------|
| Accent (ember) | `#c4622d` |
| Background cream | `#f5ede4` |
| Sage green (hero) | `#7a9e7e` |
| Dark brown | `#2a1f1a` |
| Heading font | Playfair Display (serif) |
| Body font | DM Sans (sans-serif) |

Brand colors are applied as **inline `style` props** in components, not via Tailwind classes. Keep this pattern when making changes. Canonical CSS variables live in `src/styles/theme.css`.

### Social / external links
- Substack: https://everywomanhealth.substack.com/
- TikTok: @everywomanhealth
- Instagram: everywoman.io
- Email: everywoman.io@gmail.com
- Free consultation (Google Calendar): configured in `src/app/constants.ts` as `CONSULTATION_URL`

### Notes on swapping images
To change an image, copy the new file over the existing one in `src/imports/`. The logo is `logo.png`. The portrait in the about card is `profile.png`. For services, replace `PortraitPlaceholder` usage with a real image import when ready. The `ImageWithFallback` component handles broken images gracefully.
