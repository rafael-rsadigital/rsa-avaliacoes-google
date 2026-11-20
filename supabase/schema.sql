-- RSA Digital: armazenamento privado do refresh token OAuth do Google.
-- Execute no SQL Editor do projeto Supabase dedicado a esta integração.

create table if not exists public.google_oauth_tokens (
  id text primary key check (id = 'primary'),
  encrypted_refresh_token text not null,
  updated_at timestamptz not null default now()
);

alter table public.google_oauth_tokens enable row level security;

-- Nenhum acesso por chaves públicas ou usuários autenticados.
revoke all on table public.google_oauth_tokens from anon, authenticated;
grant all on table public.google_oauth_tokens to service_role;
