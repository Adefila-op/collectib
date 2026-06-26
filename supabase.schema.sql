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
  email_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists email_verification_tokens (
  token_hash text primary key,
  email text references email_accounts(email) on delete cascade not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists password_reset_tokens (
  token_hash text primary key,
  email text references email_accounts(email) on delete cascade not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
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
  slug text unique,
  location text,
  practice text,
  collection_title text,
  is_featured boolean not null default false,
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
create index if not exists email_verification_tokens_email_idx on email_verification_tokens(email);
create index if not exists password_reset_tokens_email_idx on password_reset_tokens(email);

do $$
begin
  alter table email_accounts
    add column email_verified_at timestamptz;
exception
  when duplicate_column then null;
end $$;

update email_accounts
set email_verified_at = coalesce(email_verified_at, created_at, now())
where email_verified_at is null;

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
  alter table artists
    add column slug text unique;
exception
  when duplicate_column then null;
end $$;

do $$
begin
  alter table artists
    add column location text;
exception
  when duplicate_column then null;
end $$;

do $$
begin
  alter table artists
    add column practice text;
exception
  when duplicate_column then null;
end $$;

do $$
begin
  alter table artists
    add column collection_title text;
exception
  when duplicate_column then null;
end $$;

do $$
begin
  alter table artists
    add column is_featured boolean not null default false;
exception
  when duplicate_column then null;
end $$;

create unique index if not exists artists_slug_idx on artists(slug);
create index if not exists artists_featured_idx on artists(is_featured, created_at desc);

do $$
begin
  alter table artworks
    drop constraint if exists artworks_status_check;
  alter table artworks
    add constraint artworks_status_check
    check (status in ('draft', 'listed', 'owned', 'reserved', 'sold', 'delisted'));
end $$;

insert into profiles (id, wallet_address, display_name)
values
  ('00000000-0000-4000-8000-000000000001', 'admin-owned-real-assets', 'Collectibles Admin')
on conflict (wallet_address) do update
set display_name = excluded.display_name,
    updated_at = now();

insert into artists (
  id,
  profile_id,
  name,
  slug,
  location,
  practice,
  collection_title,
  bio,
  avatar_url,
  is_featured
)
values
  (
    '00000000-0000-4000-8000-000000000101',
    '00000000-0000-4000-8000-000000000001',
    'Slawn',
    'slawn',
    'Lagos / London',
    'Painting, street culture, sculpture',
    'Admin-owned Slawn Collection',
    'Featured admin collection for Slawn. Assets here represent physical inventory held by the platform and accept collector offers only.',
    '/assets/art/slawn-profile.jpg',
    true
  ),
  (
    '00000000-0000-4000-8000-000000000102',
    '00000000-0000-4000-8000-000000000001',
    'Amoako Boafo',
    'amoako-boafo',
    'Accra / Vienna',
    'Figurative painting',
    'Admin-owned Amoako Boafo Collection',
    'Featured admin collection for Amoako Boafo. Assets here represent physical inventory held by the platform and accept collector offers only.',
    null,
    true
  ),
  (
    '00000000-0000-4000-8000-000000000103',
    '00000000-0000-4000-8000-000000000001',
    'Ken Nwadiogbu',
    'ken-nwadiogbu',
    'Lagos / London',
    'Contemporary drawing, painting, mixed media',
    'Admin-owned Ken Nwadiogbu Collection',
    'Featured admin collection for Ken Nwadiogbu. Assets here represent physical inventory held by the platform and accept collector offers only.',
    null,
    true
  ),
  (
    '00000000-0000-4000-8000-000000000104',
    '00000000-0000-4000-8000-000000000001',
    'Silas Onoja',
    'silas-onoja',
    'Nigeria',
    'Realism and contemporary portraiture',
    'Admin-owned Silas Onoja Collection',
    'Featured admin collection for Silas Onoja. Assets here represent physical inventory held by the platform and accept collector offers only.',
    null,
    true
  )
on conflict (id) do update
set name = excluded.name,
    slug = excluded.slug,
    location = excluded.location,
    practice = excluded.practice,
    collection_title = excluded.collection_title,
    bio = excluded.bio,
    avatar_url = excluded.avatar_url,
    is_featured = excluded.is_featured;

insert into artworks (
  id,
  seller_profile_id,
  artist_id,
  title,
  description,
  price_amount,
  price_currency,
  image_url,
  status
)
values
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'Bobo in Blue', 'Admin-owned physical Slawn artwork asset. This is a real-world collection record, not a chain-only mint, and collectors can submit offers only.', 120000, 'USD', '/assets/art/slawn-bobo-in-blue.jpg', 'owned'),
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'London Blindness', 'Admin-owned physical Slawn artwork asset. This is a real-world collection record, not a chain-only mint, and collectors can submit offers only.', 115000, 'USD', '/assets/art/slawn-london-blindness.jpg', 'owned'),
  ('00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'Moses', 'Admin-owned physical Slawn artwork asset. This is a real-world collection record, not a chain-only mint, and collectors can submit offers only.', 132000, 'USD', null, 'owned'),
  ('00000000-0000-4000-8000-000000000204', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'Nigeria, My Country', 'Admin-owned physical Slawn artwork asset. This is a real-world collection record, not a chain-only mint, and collectors can submit offers only.', 128000, 'USD', null, 'owned'),
  ('00000000-0000-4000-8000-000000000205', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'Hot Head', 'Admin-owned physical Slawn artwork asset. This is a real-world collection record, not a chain-only mint, and collectors can submit offers only.', 98000, 'USD', null, 'owned'),
  ('00000000-0000-4000-8000-000000000206', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000102', 'The Lemon Bathing Suit', 'Admin-owned physical Amoako Boafo artwork asset. This is a real-world collection record, not a chain-only mint, and collectors can submit offers only.', 280000, 'USD', null, 'owned'),
  ('00000000-0000-4000-8000-000000000207', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000102', 'Pink Suit Portrait', 'Admin-owned physical Amoako Boafo artwork asset. This is a real-world collection record, not a chain-only mint, and collectors can submit offers only.', 245000, 'USD', null, 'owned'),
  ('00000000-0000-4000-8000-000000000208', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000102', 'Yellow Dress', 'Admin-owned physical Amoako Boafo artwork asset. This is a real-world collection record, not a chain-only mint, and collectors can submit offers only.', 260000, 'USD', null, 'owned'),
  ('00000000-0000-4000-8000-000000000209', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000102', 'Black Diaspora Series', 'Admin-owned physical Amoako Boafo artwork asset. This is a real-world collection record, not a chain-only mint, and collectors can submit offers only.', 310000, 'USD', null, 'owned'),
  ('00000000-0000-4000-8000-000000000210', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000102', 'CACTUS', 'Admin-owned physical Amoako Boafo artwork asset. This is a real-world collection record, not a chain-only mint, and collectors can submit offers only.', 225000, 'USD', null, 'owned'),
  ('00000000-0000-4000-8000-000000000211', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000103', 'Journey Mercies', 'Admin-owned physical Ken Nwadiogbu artwork asset. This is a real-world collection record, not a chain-only mint, and collectors can submit offers only.', 65000, 'USD', null, 'owned'),
  ('00000000-0000-4000-8000-000000000212', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000103', 'The Migrant', 'Admin-owned physical Ken Nwadiogbu artwork asset. This is a real-world collection record, not a chain-only mint, and collectors can submit offers only.', 72000, 'USD', null, 'owned'),
  ('00000000-0000-4000-8000-000000000213', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000103', 'Packages in Brown Skin', 'Admin-owned physical Ken Nwadiogbu artwork asset. This is a real-world collection record, not a chain-only mint, and collectors can submit offers only.', 78000, 'USD', null, 'owned'),
  ('00000000-0000-4000-8000-000000000214', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000103', 'Reflection Series', 'Admin-owned physical Ken Nwadiogbu artwork asset. This is a real-world collection record, not a chain-only mint, and collectors can submit offers only.', 69000, 'USD', null, 'owned'),
  ('00000000-0000-4000-8000-000000000215', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000103', 'Contemporealism Series', 'Admin-owned physical Ken Nwadiogbu artwork asset. This is a real-world collection record, not a chain-only mint, and collectors can submit offers only.', 84000, 'USD', null, 'owned'),
  ('00000000-0000-4000-8000-000000000216', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000104', 'Homecoming', 'Admin-owned physical Silas Onoja artwork asset. This is a real-world collection record, not a chain-only mint, and collectors can submit offers only.', 42000, 'USD', '/assets/art/silas-onoja-homecoming.jpg', 'owned'),
  ('00000000-0000-4000-8000-000000000217', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000104', 'Shared Stories', 'Admin-owned physical Silas Onoja artwork asset. This is a real-world collection record, not a chain-only mint, and collectors can submit offers only.', 38000, 'USD', '/assets/art/silas-onoja-shared-stories.jpg', 'owned'),
  ('00000000-0000-4000-8000-000000000218', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000104', 'Morning Light', 'Admin-owned physical Silas Onoja artwork asset. This is a real-world collection record, not a chain-only mint, and collectors can submit offers only.', 45000, 'USD', null, 'owned'),
  ('00000000-0000-4000-8000-000000000219', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000104', 'The Conversation', 'Admin-owned physical Silas Onoja artwork asset. This is a real-world collection record, not a chain-only mint, and collectors can submit offers only.', 47000, 'USD', null, 'owned'),
  ('00000000-0000-4000-8000-000000000220', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000104', 'New Beginnings', 'Admin-owned physical Silas Onoja artwork asset. This is a real-world collection record, not a chain-only mint, and collectors can submit offers only.', 40000, 'USD', null, 'owned')
on conflict (id) do update
set title = excluded.title,
    description = excluded.description,
    price_amount = excluded.price_amount,
    price_currency = excluded.price_currency,
    image_url = excluded.image_url,
    status = excluded.status,
    updated_at = now();

do $$
begin
  alter table artworks
    add constraint artworks_status_check
    check (status in ('draft', 'listed', 'owned', 'reserved', 'sold', 'delisted'));
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
