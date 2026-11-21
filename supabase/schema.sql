-- RSA Digital: armazenamento privado dos refresh tokens OAuth do Google.
-- Execute no SQL Editor do projeto Supabase dedicado a esta integração.

create table if not exists public.google_oauth_tokens (
  id text primary key check (id = 'primary'),
  encrypted_refresh_token text not null,
  updated_at timestamptz not null default now()
);

alter table public.google_oauth_tokens enable row level security;
revoke all on table public.google_oauth_tokens from anon, authenticated;
grant all on table public.google_oauth_tokens to service_role;

-- Armazena várias contas Google. O ID "primary" preserva a conta original.
create table if not exists public.google_oauth_accounts (
  id text primary key,
  label text not null,
  encrypted_refresh_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.google_oauth_accounts enable row level security;
revoke all on table public.google_oauth_accounts from anon, authenticated;
grant all on table public.google_oauth_accounts to service_role;

-- Migra a conexão original sem apagar nem alterar a tabela antiga.
insert into public.google_oauth_accounts (id, label, encrypted_refresh_token, created_at, updated_at)
select 'primary', 'Conta Google principal', encrypted_refresh_token, updated_at, updated_at
from public.google_oauth_tokens
where id = 'primary'
on conflict (id) do nothing;
