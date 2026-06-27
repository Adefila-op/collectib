do $$
begin
  alter table offers
    add column payment_provider text;
exception
  when duplicate_column then null;
end $$;

do $$
begin
  alter table offers
    add column payment_reference text;
exception
  when duplicate_column then null;
end $$;

do $$
begin
  alter table offers
    add column payment_payload jsonb;
exception
  when duplicate_column then null;
end $$;

do $$
begin
  alter table offers
    add column settlement_signature text;
exception
  when duplicate_column then null;
end $$;

create index if not exists offers_payment_reference_idx on offers(payment_reference);

do $$
begin
  alter table offers
    drop constraint if exists offers_status_check;
  alter table offers
    add constraint offers_status_check
    check (status in ('pending_payment', 'payment_review', 'crypto_submitted', 'active', 'accepted', 'rejected', 'withdrawn', 'expired'));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table offers
    add constraint offers_payment_provider_check
    check (payment_provider is null or payment_provider in ('wallet', 'flutterwave'));
exception
  when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
