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
const conn = env.POSTGRES_URL || env.POSTGRES_PRISMA_URL || env.POSTGRES_URL_NON_POOLING;
(async () => {
  const client = new Client({ connectionString: conn, ssl: false, connectionTimeoutMillis: 8000, statement_timeout: 8000 });
  console.log('Starting connect without SSL');
  try {
    await client.connect();
    console.log('CONNECTED');
    const r = await client.query('select 1 as ok');
    console.log('RESULT', r.rows[0].ok);
    await client.end();
  } catch (e) {
    console.log('ERROR', e.code || e.name, e.message);
    try { await client.end(); } catch {}
  }
})();
