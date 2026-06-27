create table if not exists affiliate_accounts (
  profile_id uuid primary key references profiles(id) on delete cascade,
  lead_profile_id uuid references profiles(id) on delete set null,
  role text not null default 'affiliate',
  status text not null default 'approved',
  affiliate_code text unique not null,
  phone text,
  community_name text,
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists affiliate_campaigns (
  id uuid primary key default gen_random_uuid(),
  affiliate_profile_id uuid references profiles(id) on delete cascade not null,
  artwork_id uuid references artworks(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique (affiliate_profile_id, artwork_id)
);

create table if not exists affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references affiliate_campaigns(id) on delete cascade,
  affiliate_profile_id uuid references profiles(id) on delete cascade not null,
  artwork_id uuid references artworks(id) on delete cascade not null,
  visitor_key text,
  user_agent text,
  clicked_at timestamptz not null default now()
);

create table if not exists affiliate_commissions (
  id uuid primary key default gen_random_uuid(),
  affiliate_profile_id uuid references profiles(id) on delete cascade not null,
  lead_profile_id uuid references profiles(id) on delete set null,
  order_id uuid references orders(id) on delete cascade unique,
  artwork_id uuid references artworks(id) on delete cascade not null,
  amount numeric(18, 6) not null,
  currency text not null default 'USD',
  status text not null default 'pending_payment',
  protection_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table affiliate_accounts
  add column if not exists community_name text;

create index if not exists affiliate_accounts_lead_idx
  on affiliate_accounts(lead_profile_id);

create unique index if not exists affiliate_accounts_code_idx
  on affiliate_accounts(affiliate_code);

create index if not exists affiliate_campaigns_affiliate_idx
  on affiliate_campaigns(affiliate_profile_id, created_at desc);

create unique index if not exists affiliate_campaigns_unique_idx
  on affiliate_campaigns(affiliate_profile_id, artwork_id);

create index if not exists affiliate_clicks_affiliate_idx
  on affiliate_clicks(affiliate_profile_id, clicked_at desc);

create index if not exists affiliate_clicks_campaign_idx
  on affiliate_clicks(campaign_id, clicked_at desc);

create index if not exists affiliate_commissions_affiliate_idx
  on affiliate_commissions(affiliate_profile_id, created_at desc);

create index if not exists affiliate_commissions_status_idx
  on affiliate_commissions(status, created_at desc);

create unique index if not exists affiliate_commissions_order_idx
  on affiliate_commissions(order_id);

do $$
begin
  alter table affiliate_accounts
    add constraint affiliate_accounts_role_check
    check (role in ('affiliate', 'lead'));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table affiliate_accounts
    add constraint affiliate_accounts_status_check
    check (status in ('pending', 'approved', 'suspended'));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table affiliate_commissions
    add constraint affiliate_commissions_status_check
    check (status in ('pending_payment', 'pending', 'approved', 'paid', 'void'));
exception
  when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
