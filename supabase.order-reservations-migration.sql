alter table orders
  add column if not exists expires_at timestamptz;

update orders
set expires_at = created_at + interval '30 minutes'
where expires_at is null
  and status in ('pending', 'payment_review', 'crypto_submitted');

create index if not exists orders_expiry_idx
  on orders(status, expires_at);

do $$
begin
  alter table orders
    drop constraint if exists orders_payment_provider_check;

  alter table orders
    add constraint orders_payment_provider_check
    check (payment_provider in ('wallet', 'flutterwave'));
end $$;

notify pgrst, 'reload schema';
