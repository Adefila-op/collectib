create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  wallet_address text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists connected_wallets (
  wallet_address text primary key,
  profile_id uuid references profiles(id),
  chain text not null default 'solana',
  last_connected_at timestamptz not null default now(),
  holdings_snapshot jsonb,
  created_at timestamptz not null default now()
);

create table if not exists wallet_nonces (
  wallet_address text primary key,
  nonce text not null,
  message text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists email_accounts (
  email text primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists auth_recognitions (
  recognition_key text primary key,
  profile_id uuid references profiles(id) on delete cascade,
  kind text not null,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists promo_banners (
  id text primary key,
  greeting text not null,
  message text not null,
  cta_label text not null,
  details_title text not null,
  details_body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists artists (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id),
  name text not null,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists artworks (
  id uuid primary key default gen_random_uuid(),
  seller_profile_id uuid references profiles(id) not null,
  artist_id uuid references artists(id),
  title text not null,
  description text,
  price_amount numeric(18, 6) not null,
  price_currency text not null default 'USD',
  asking_price numeric(18, 6) generated always as (price_amount) stored,
  token_mint text,
  metadata_uri text,
  image_url text,
  status text not null default 'listed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists offers (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid references artworks(id) not null,
  buyer_profile_id uuid references profiles(id) not null,
  seller_profile_id uuid references profiles(id) not null,
  offeror_wallet text,
  amount numeric(18, 6) not null,
  currency text not null default 'USD',
  message text,
  status text not null default 'active',
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid references artworks(id) not null,
  buyer_profile_id uuid references profiles(id),
  seller_profile_id uuid references profiles(id),
  sale_price numeric(18, 6) not null,
  currency text not null default 'USD',
  source_offer_id uuid references offers(id),
  tx_signature text,
  created_at timestamptz not null default now()
);

create table if not exists artwork_market_value (
  artwork_id uuid primary key references artworks(id) on delete cascade,
  market_value numeric(18, 6) not null,
  last_sale_price numeric(18, 6),
  highest_active_offer numeric(18, 6),
  average_active_offers numeric(18, 6),
  signal_count integer not null default 0,
  currency text not null default 'USD',
  updated_at timestamptz not null default now()
);

create table if not exists price_history (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid references artworks(id) on delete cascade not null,
  value numeric(18, 6) not null,
  type text not null,
  sale_price numeric(18, 6),
  highest_active_offer numeric(18, 6),
  average_active_offers numeric(18, 6),
  signal_count integer not null default 0,
  source_offer_id uuid references offers(id),
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid references artworks(id) not null,
  buyer_profile_id uuid references profiles(id) not null,
  seller_profile_id uuid references profiles(id) not null,
  amount numeric(18, 6) not null,
  currency text not null,
  payment_provider text not null,
  payment_reference text,
  payment_payload jsonb,
  settlement_signature text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_type text not null,
  external_id text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists chain_events (
  signature text primary key,
  event_type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists service_pings (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  created_at timestamptz not null default now()
);

create index if not exists artworks_status_created_idx on artworks(status, created_at desc);
create index if not exists offers_buyer_idx on offers(buyer_profile_id, created_at desc);
create index if not exists offers_seller_idx on offers(seller_profile_id, created_at desc);
create index if not exists offers_artwork_status_idx on offers(artwork_id, status, created_at desc);
create index if not exists offers_expires_idx on offers(expires_at) where status = 'active';
create index if not exists orders_buyer_idx on orders(buyer_profile_id, created_at desc);
create index if not exists sales_artwork_created_idx on sales(artwork_id, created_at desc);
create index if not exists price_history_artwork_created_idx on price_history(artwork_id, created_at desc);
create index if not exists webhook_events_provider_idx on webhook_events(provider, created_at desc);

do $$
begin
  alter table connected_wallets
    add column chain text not null default 'solana';
exception
  when duplicate_column then null;
end $$;

create index if not exists connected_wallets_profile_chain_idx on connected_wallets(profile_id, chain);
create index if not exists auth_recognitions_profile_idx on auth_recognitions(profile_id);
create index if not exists auth_recognitions_last_seen_idx on auth_recognitions(last_seen_at desc);

do $$
begin
  alter table connected_wallets
    add constraint connected_wallets_chain_check
    check (chain in ('solana'));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table auth_recognitions
    add constraint auth_recognitions_kind_check
    check (kind in ('device', 'ip'));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table artworks
    add constraint artworks_status_check
    check (status in ('draft', 'listed', 'reserved', 'sold', 'delisted'));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table offers
    add constraint offers_status_check
    check (status in ('active', 'accepted', 'rejected', 'withdrawn', 'expired'));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table offers
    add constraint offers_currency_check
    check (currency in ('USD', 'USDC', 'SOL'));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table orders
    add constraint orders_status_check
    check (status in ('pending', 'payment_review', 'crypto_submitted', 'paid', 'cancelled', 'failed'));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table orders
    add constraint orders_payment_provider_check
    check (payment_provider in ('wallet', 'flutterwave', 'moonpay'));
exception
  when duplicate_object then null;
end $$;

create unique index if not exists orders_one_active_artwork_idx
  on orders(artwork_id)
  where status in ('pending', 'payment_review', 'crypto_submitted', 'paid');
