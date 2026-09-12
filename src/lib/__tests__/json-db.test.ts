import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { JsonDB, JsonDBError, ReadOnlyError } from '../json-db';

const tempRoot = path.join(os.tmpdir(), 'bali-json-db-tests');

const examplePayload = {
  _meta: {
    version: 1,
    lastModified: '2026-03-25T12:00:00.000Z',
    description: 'Example collection',
  },
  records: [
    {
      id: 'ex_001',
      createdAt: '2026-03-25T12:00:00.000Z',
      updatedAt: '2026-03-25T12:00:00.000Z',
      name: 'Registro de prueba',
      active: true,
    },
  ],
};

describe('JsonDB', () => {
  beforeEach(async () => {
    await fs.mkdir(tempRoot, { recursive: true });
    await fs.writeFile(path.join(tempRoot, 'example.json'), JSON.stringify(examplePayload, null, 2));
  });

  afterEach(async () => {
    await fs.rm(tempRoot, { recursive: true, force: true });
    const env = process.env as Record<string, string | undefined>;
    delete env.NODE_ENV;
  });

  it('getAll returns all records', async () => {
    const db = new JsonDB({ dataDir: tempRoot });
    const result = await db.getAll('example');
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('getById returns the correct record', async () => {
    const db = new JsonDB({ dataDir: tempRoot });
    const item = await db.getById('example', 'ex_001');
    expect((item as { name?: string } | null)?.name).toBe('Registro de prueba');
  });

  it('create inserts a record', async () => {
    const db = new JsonDB({ dataDir: tempRoot });
    const created = await db.create('example', { name: 'Nuevo', active: false });
    expect(created.id.startsWith('ex_')).toBe(true);
    expect(created.createdAt).toBeDefined();
    expect(created.updatedAt).toBeDefined();
  });

  it('update modifies values and timestamps', async () => {
    const db = new JsonDB({ dataDir: tempRoot });
    const updated = await db.update('example', 'ex_001', { name: 'Actualizado', active: false });
    const originalUpdatedAt = examplePayload.records[0]?.updatedAt ?? '';
    expect((updated as { name?: string } | null)?.name).toBe('Actualizado');
    expect((updated as { updatedAt?: string } | null)?.updatedAt).not.toBe(originalUpdatedAt);
  });

  it('remove deletes a record', async () => {
    const db = new JsonDB({ dataDir: tempRoot });
    await db.remove('example', 'ex_001');
    const item = await db.getById('example', 'ex_001');
    expect(item).toBeNull();
  });

  it('query filters correctly', async () => {
    const db = new JsonDB({ dataDir: tempRoot });
    const filtered = await db.query('example', (record) => (record as { active?: boolean }).active === true);
    expect(filtered).toHaveLength(1);
  });

  it('count returns the number of records', async () => {
    const db = new JsonDB({ dataDir: tempRoot });
    const count = await db.count('example');
    expect(count).toBe(1);
  });

  it('rejects malformed schema data', async () => {
    const db = new JsonDB({ dataDir: tempRoot });
    await expect(
      db.create('example', { name: '', active: 'invalid' } as never),
    ).rejects.toBeInstanceOf(JsonDBError);
  });

  it('throws ReadOnlyError in production', async () => {
    const env = process.env as Record<string, string | undefined>;
    env.NODE_ENV = 'production';
    const db = new JsonDB({ dataDir: tempRoot });
    await expect(db.create('example', { name: 'Nope', active: true })).rejects.toBeInstanceOf(ReadOnlyError);
  });
});
