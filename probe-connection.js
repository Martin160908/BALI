const fs = require('fs');
const { Client } = require('pg');
const env = {};
for (const raw of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const line = raw.trim();
  if (!line || line.startsWith('#') || !line.includes('=')) continue;
  const i = line.indexOf('=');
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  env[k] = v;
}
const candidates = [env.POSTGRES_URL, env.POSTGRES_PRISMA_URL, env.POSTGRES_URL_NON_POOLING];
(async () => {
  for (const conn of candidates) {
    if (!conn) continue;
    const url = new URL(conn);
    console.log('TRY', url.hostname, url.port, 'ssl=', String(conn).includes('sslmode=require') ? 'yes' : 'no');
    const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000, statement_timeout: 15000 });
    try {
      await client.connect();
      const r = await client.query('select 1 as ok');
      console.log('CONNECTED', r.rows[0].ok);
      await client.end();
      process.exit(0);
    } catch (e) {
      console.log('ERROR', e.code || e.name, e.message);
      try { await client.end(); } catch {}
    }
  }
  console.log('NO_CONNECTION');
  process.exit(1);
})();
