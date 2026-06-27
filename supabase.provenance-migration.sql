create table if not exists provenance_certificates (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid references artworks(id) on delete cascade not null,
  holder_profile_id uuid references profiles(id) on delete cascade not null,
  source text not null,
  source_id uuid,
  status text not null default 'active',
  onchain_status text not null default 'pending_mint',
  chain text not null default 'solana',
  certificate_mint text,
  mint_signature text,
  burn_signature text,
  certificate_payload jsonb,
  burn_payload jsonb,
  issued_at timestamptz not null default now(),
  burned_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists provenance_certificates_holder_idx
  on provenance_certificates(holder_profile_id, status, issued_at desc);

create index if not exists provenance_certificates_artwork_idx
  on provenance_certificates(artwork_id, status, issued_at desc);

create unique index if not exists provenance_certificates_one_active_artwork_idx
  on provenance_certificates(artwork_id)
  where status = 'active';

do $$
begin
  alter table provenance_certificates
    add constraint provenance_certificates_status_check
    check (status in ('active', 'burned', 'revoked'));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table provenance_certificates
    add constraint provenance_certificates_onchain_status_check
    check (onchain_status in ('pending_mint', 'minted', 'pending_burn', 'burned', 'failed'));
exception
  when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
