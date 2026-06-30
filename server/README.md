# Collectibles API

Node + Express backend for the Vite SPA.

## Run Locally

```bash
cp .env.example .env
npm run dev:api
```

The API listens on `http://localhost:8787`.

## Core Routes

- `GET /api/health` - uptime check.
- `POST /api/auth/nonce` - creates a wallet-login nonce and message.
- `POST /api/auth/verify` - verifies a Solana wallet signature and returns a JWT.
- `POST /api/auth/signup` - creates an email/password profile and returns a JWT.
- `POST /api/auth/login` - verifies email/password credentials and returns a JWT.
- `GET /api/artworks` and `GET /api/artworks/:id` - public listing data.
- `POST /api/artworks` - create a listing with a bearer token.
- `GET/POST/PATCH /api/offers` - authenticated offer workflow.
- `GET/POST /api/orders` - authenticated order records.
- `GET /api/wallets/:address/nfts` - Helius DAS proxy for wallet-owned NFTs.
- `POST /api/webhooks/helius` - records Helius events and chain signatures.
- `POST /api/webhooks/flutterwave` - records payment events and marks matching orders.
- `GET /api/cron/supabase-ping` - cron endpoint to keep the Supabase free tier awake.

## Supabase

Run `supabase.schema.sql` in the Supabase SQL editor. Use the service role key only in backend environment variables.

Email signup, verification links, resend verification, and password resets are handled by Supabase Auth. The app does not run its own SMTP/token email service.

## Wallet Login Flow

1. Frontend sends `{ walletAddress }` to `/api/auth/nonce`.
2. Backend stores a one-time nonce and returns a human-readable message.
3. User signs the message in Phantom, Backpack, Solflare, or another Solana wallet.
4. Frontend sends `{ walletAddress, signature }` to `/api/auth/verify`.
5. Backend verifies the Ed25519 signature against the wallet public key, deletes the nonce, and returns a JWT.

The signature never moves funds and the backend never sees private keys.
