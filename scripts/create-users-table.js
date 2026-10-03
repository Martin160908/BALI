const fs = require('fs');
const { Client } = require('pg');

function readEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;

    const idx = line.indexOf('=');
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

(async () => {
  const env = readEnvFile('./.env.local');
  const connectionString = env.POSTGRES_URL || env.POSTGRES_PRISMA_URL || env.POSTGRES_URL_NON_POOLING;

  if (!connectionString) {
    throw new Error('No se encontró la variable POSTGRES_URL en .env.local');
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    statement_timeout: 15000,
  });

  try {
    console.log('Intentando conectar a la base de datos...');
    await client.connect();
    console.log('Conexión establecida');

    await client.query(`
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
    `);

    await client.query(`
      create index if not exists idx_users_email
      on public.users (email);
    `);

    console.log('Tabla public.users creada correctamente');
  } finally {
    await client.end();
  }
})();
