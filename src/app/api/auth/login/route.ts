import { NextResponse } from 'next/server';
import { Client } from 'pg';
import crypto from 'node:crypto';

const DEFAULT_ADMIN_EMAIL = 'admin@bali.com';
const DEFAULT_ADMIN_PASSWORD_HASH = '3eb3fe66b31e3b4d10fa70b5cad49c7112294af6ae4e476a1c405155d45aa121';

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function ensureUsersTable(client: Client) {
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

  await client.query(`
    create index if not exists idx_users_email on public.users (email);
  `);

  await client.query(`
    create or replace function public.set_updated_at()
    returns trigger
    language plpgsql
    as $$
    begin
      new.updated_at = now();
      return new;
    end;
    $$;
  `);

  await client.query(`
    do $$
    begin
      if not exists (
        select 1 from pg_trigger where tgname = 'trg_users_updated_at'
      ) then
        create trigger trg_users_updated_at
        before update on public.users
        for each row
        execute function public.set_updated_at();
      end if;
    end
    $$;
  `);
}

async function ensureDefaultAdminUser(client: Client) {
  const result = await client.query('select count(*) as total from public.users');
  const totalUsers = Number(result.rows[0]?.total ?? 0);

  if (totalUsers > 0) {
    return;
  }

  await client.query(
    `
      insert into public.users (email, password_hash, full_name, role, is_active)
      values ($1, $2, $3, $4, true)
      on conflict (email) do nothing
    `,
    [DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD_HASH, 'Administrador', 'admin'],
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? '';

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email y contraseña son obligatorios.',
        },
        { status: 400 },
      );
    }

    const connectionString =
      process.env.POSTGRES_URL ??
      process.env.POSTGRES_PRISMA_URL ??
      process.env.POSTGRES_URL_NON_POOLING;

    if (!connectionString) {
      return NextResponse.json(
        {
          success: false,
          error: 'Falta la configuración de la base de datos.',
        },
        { status: 500 },
      );
    }

    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
      statement_timeout: 15000,
    });

    try {
      await client.connect();
      await ensureUsersTable(client);
      await ensureDefaultAdminUser(client);

      const result = await client.query(
        `
          select id, email, full_name, role, password_hash
          from public.users
          where lower(email) = $1 and is_active = true
          limit 1
        `,
        [email],
      );

      const user = result.rows[0];
      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error: 'Correo o contraseña incorrectos.',
          },
          { status: 401 },
        );
      }

      const hashedPassword = hashPassword(password);
      const isPasswordValid = hashedPassword === user.password_hash;

      if (!isPasswordValid) {
        return NextResponse.json(
          {
            success: false,
            error: 'Correo o contraseña incorrectos.',
          },
          { status: 401 },
        );
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        },
      });
    } finally {
      await client.end();
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'No se pudo completar el inicio de sesión.',
      },
      { status: 500 },
    );
  }
}
