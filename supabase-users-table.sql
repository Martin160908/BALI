-- SQL para crear la tabla users en Supabase
-- Este esquema está pensado para login por email + password_hash

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_email
  on public.users (email);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

alter table public.users enable row level security;

create policy "users_select_own"
  on public.users
  for select
  using (auth.uid() = id);

create policy "users_insert_any"
  on public.users
  for insert
  with check (true);

create policy "users_update_own"
  on public.users
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Ejemplo de insert para usuario administrador:
-- insert into public.users (email, password_hash, full_name, role)
-- values (
--   'admin@bali.com',
--   '$2a$10$abcdefghijklmnopqrstuv',
--   'Administrador',
--   'admin'
-- );

-- Ejemplo de consulta para login:
-- select id, email, full_name, role
-- from public.users
-- where email = 'admin@bali.com'
--   and is_active = true;
