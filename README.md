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

### Where everything lives
- **Entry point:** `src/main.tsx` → renders `<App />` from `src/app/App.tsx` (React Router)
- **Pages:** `src/app/pages/HomePage.tsx`, `src/app/pages/AboutPage.tsx`, `src/app/pages/ServicesPage.tsx`
- **Shared UI:** `src/app/components/SiteNav.tsx`, `SiteFooter.tsx`, `PortraitPlaceholder.tsx`, `TierComparisonGrid.tsx`
- **Copy / tiers:** `src/app/content/coaching.ts`, `src/app/content/articles.ts`
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
