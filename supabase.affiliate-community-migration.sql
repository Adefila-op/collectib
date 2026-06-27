alter table affiliate_accounts
  add column if not exists community_name text;

notify pgrst, 'reload schema';
