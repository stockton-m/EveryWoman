# EveryWoman

A single-page website for **EveryWoman** — a women's health and fitness platform built around strength training and movement for those living with endometriosis, PCOS, pre/postpartum symptoms, and those navigating perimenopause and menopause. Founded by Madeleine Stockton.

The live site is deployed on **Netlify**. The codebase was originally generated from a Figma design using Figma Make, then customized via Claude Code.

---

## For a future AI agent continuing this project

### What this project is
This is a **static single-page React website**. There is no backend, no database, and no server. Everything is in one page. When built, it produces a `dist/` folder of plain HTML/CSS/JS files that Netlify serves to visitors.

### Who the author is
Madeleine Stockton is the founder and is **not technical**. She communicates changes conversationally (e.g. "make the photo smaller", "change this text to..."). All code changes should be made by the AI agent — she should never need to edit code manually.

### How to get the site running locally (for development/preview)
1. Open Terminal and navigate to this folder:
   ```
   cd ~/Desktop/EveryWoman
   ```
2. Install dependencies (only needed once, or after pulling new changes):
   ```
   npm install --legacy-peer-deps
   ```
   > Note: `--legacy-peer-deps` is required due to a peer dependency conflict with `react-dnd`. This is a known issue and safe to ignore.
3. Start the local preview server:
   ```
   npm run dev
   ```
4. Open your browser to `http://localhost:5173` to see the site.

### How to build for deployment
```
npm run build
```
This creates a `dist/` folder. Drag that folder onto Netlify, or deploy via the Netlify CLI:
```
npx netlify-cli deploy --dir=dist --prod
```

### Where everything lives
- **All page content and layout:** `src/app/App.tsx` — this is the one file that contains the entire page. Every section (hero, about, posts, waitlist, connect, footer) is in here.
- **Images:** `src/imports/` — PNG files referenced as `image-1.png` through `image-5.png` in App.tsx.
- **Styles:** `src/styles/` — CSS files. `index.css` imports the others. Brand colors and typography are defined as inline styles in `App.tsx`, not in CSS.
- **shadcn/ui components:** `src/app/components/ui/` — a library of UI components. Most are unused but available.
- **Figma image helper:** `src/app/components/figma/ImageWithFallback.tsx` — a wrapper around `<img>` that shows a placeholder if an image fails to load.

### Brand design reference
| Token | Value |
|-------|-------|
| Accent (ember) | `#c4622d` |
| Background cream | `#f5ede4` |
| Sage green (hero) | `#7a9e7e` |
| Dark brown | `#2a1f1a` |
| Heading font | Playfair Display (serif) |
| Body font | DM Sans (sans-serif) |

Brand colors are applied as **inline `style` props** in `App.tsx`, not via Tailwind classes. Keep this pattern when making changes.

### Sections on the page (in order)
1. **Hero** — sage green gradient background, site title, subtitle text, Subscribe & Join button
2. **About** — white card with Madeleine's story and her portrait photo
3. **Latest Posts** — three article cards linking to Substack posts
4. **Training Waitlist** — form (name + email) that opens a mailto: to `everywoman.io@gmail.com`
5. **Connect** — four social bubbles: Substack, TikTok, Email, Instagram
6. **Footer**

### Nav links
About, Posts, Waitlist, Connect scroll to their sections. Podcast is currently a placeholder (no link yet).

### Social / external links
- Substack: https://everywomanhealth.substack.com/
- TikTok: @everywomanhealth
- Instagram: everywoman.io
- Email: everywoman.io@gmail.com

### Notes on swapping images
To change an image in the hero or about section, copy the new file over the existing one in `src/imports/`. The hero photo is `image-3.png`. The logo is `image-1.png`. The portrait in the about card is `image-5.png`. The `ImageWithFallback` component handles broken images gracefully.

### See also
- `CLAUDE.md` — technical guidance specifically for Claude Code (the AI agent used to build this site)
