# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm i   # or: pnpm install

# Start development server
npm run dev

# Build for production
npm run build
```

There is no test suite.

## Architecture

This is a single-page React + Vite + TypeScript + Tailwind CSS app exported from Figma Make. The entire UI lives in one file: `src/app/App.tsx`.

**Entry point:** `src/main.tsx` → renders `<App />` from `src/app/App.tsx`

**Key paths:**
- `src/app/App.tsx` — the entire page (nav, hero, about, posts, connect sections, footer)
- `src/app/components/figma/ImageWithFallback.tsx` — image component with SVG placeholder fallback on error
- `src/app/components/ui/` — shadcn/ui component library (available but most are unused)
- `src/imports/` — image assets (PNG files referenced in App.tsx)
- `src/styles/` — CSS: `index.css` imports `fonts.css`, `tailwind.css`, and `theme.css`

**Path alias:** `@` maps to `src/`

**Design tokens (defined as constants in App.tsx):**
- `SERIF` — Playfair Display, Georgia, serif
- `SANS` — DM Sans, system-ui, sans-serif
- `EMBER` — `#c4622d` (brand accent color)
- Cream: `#f5ede4` | Sage green: `#7a9e7e` | Dark brown: `#2a1f1a`

**Styling approach:** Tailwind utility classes for layout/spacing; inline `style` props for brand colors and typography (to preserve exact design values). Do not move brand color values into Tailwind config — keep them as inline styles consistent with the existing pattern.

**Vite config notes:**
- `figma:asset/` imports resolve to `src/assets/`
- Raw asset support for `.svg` and `.csv` only — never add `.css`, `.tsx`, or `.ts` to `assetsInclude`
- React and Tailwind plugins are both required even if Tailwind is minimally used
