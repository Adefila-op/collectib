# Collectibles — Vite SPA

Converted from TanStack Start (Lovable) to a **plain Vite + React SPA**.

## What changed
- Removed `@lovable.dev/vite-tanstack-config`, `@tanstack/react-start`, `nitro`
- Removed SSR server entry (`src/server.ts`, `src/start.ts`)
- Removed Lovable-specific files (`src/lib/lovable-error-reporting.ts`, `src/lib/error-capture.ts`)
- New clean `vite.config.ts` using `@vitejs/plugin-react`, `@tailwindcss/vite`, `vite-tsconfig-paths`
- New `index.html` and `src/main.tsx` client entry point
- Stripped `head:` SSR metadata from all routes (not supported in client-mode router)
- `vite build` output set to `base: "./"` so the built files open directly in Chrome

## Setup

```bash
npm install
npm run build
```

## Supabase + Wallet Setup

1. Create or open your Supabase project.
2. Run `supabase.schema.sql` in the Supabase SQL editor.
3. Copy `.env.example` to `.env`.
4. In `.env`, set:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
   - `HELIUS_API_KEY` if you want connected wallet NFTs to load.
5. Keep `VITE_API_URL=http://localhost:8787` for local frontend-to-backend calls.

Run the API and app in two terminals:

```bash
npm run dev:api
npm run dev
```

Then visit `http://localhost:5173`. The wallet onboarding flow uses Phantom or Solflare to sign a backend nonce, stores the returned JWT locally, and calls the Express API with a bearer token.

## Open in Chrome
After building, open `dist/index.html` directly in Chrome.

For routing to work properly with hash-based navigation, or just run:

```bash
npm run preview
```

Then visit `http://localhost:4173`.

## Dev
```bash
npm run dev
```
