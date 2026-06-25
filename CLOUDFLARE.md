# Cloudflare Deployment

This project is configured for Cloudflare Workers Static Assets.

## Local Preview

```powershell
npm run cf:dev
```

## Deploy

```powershell
npx wrangler login
npm run cf:deploy
```

## API Hosting

The current API is an Express Node server. Cloudflare Workers use a Fetch API handler, so this setup serves the Vite app on Cloudflare and proxies `/api/*` to a Node API origin.

Set `API_ORIGIN` to the deployed Express API origin:

```powershell
npx wrangler secret put API_ORIGIN
```

Use a value like:

```text
https://your-api.example.com
```

Do not paste `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, or payment secrets into `wrangler.jsonc`; keep secrets in Cloudflare secrets or the Node API host.
