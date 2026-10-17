import crypto from 'node:crypto';
import { Client } from 'pg';

export function createPasswordResetToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashPasswordResetToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function createAuthDatabaseClient() {
  const connectionString =
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    process.env.POSTGRES_URL_NON_POOLING;

  if (!connectionString) {
    throw new Error('Missing database connection string');
  }

  return new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    statement_timeout: 15000,
  });
}

export async function ensureUsersTable(client: Client) {
  await client.query('create extension if not exists "pgcrypto";');
  await client.query(`
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
  `);
  await client.query('create index if not exists idx_users_email on public.users (email);');
}

export async function ensurePasswordResetTable(client: Client) {
  await client.query(`
    create table if not exists public.password_reset_tokens (
      token_hash text primary key,
      user_id uuid not null references public.users(id) on delete cascade,
      expires_at timestamptz not null,
      created_at timestamptz not null default now()
    );
  `);
  await client.query(`
    create index if not exists idx_password_reset_tokens_user_id
    on public.password_reset_tokens (user_id);
  `);
}