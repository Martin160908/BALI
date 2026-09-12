import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { GET, POST, PUT, DELETE } from '../[collection]/route';

const tempRoot = path.join(os.tmpdir(), 'bali-api-tests');

async function makeRequest(method: string, url: string, body?: unknown) {
  const init: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  return new Request(`http://localhost${url}`, init);
}

describe('data API routes', () => {
  beforeEach(async () => {
    await fs.mkdir(tempRoot, { recursive: true });
    await fs.writeFile(
      path.join(tempRoot, 'example.json'),
      JSON.stringify(
        {
          _meta: { version: 1, lastModified: '2026-03-25T12:00:00Z', description: 'Example' },
          records: [{ id: 'ex_001', createdAt: '2026-03-25T12:00:00Z', updatedAt: '2026-03-25T12:00:00Z', name: 'Registro', active: true }],
        },
        null,
        2,
      ),
    );
    process.env.DATA_DIR = tempRoot;
  });

  afterEach(async () => {
    await fs.rm(tempRoot, { recursive: true, force: true });
    delete process.env.DATA_DIR;
  });

  it('lists a collection', async () => {
    const req = await makeRequest('GET', '/api/data/example');
    const res = await GET(req, { params: Promise.resolve({ collection: 'example' }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.data)).toBe(true);
  });

  it('gets a record by id', async () => {
    const req = await makeRequest('GET', '/api/data/example?id=ex_001');
    const res = await GET(req, { params: Promise.resolve({ collection: 'example' }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.id).toBe('ex_001');
  });

  it('returns 404 for an unknown collection', async () => {
    const req = await makeRequest('GET', '/api/data/ghost');
    const res = await GET(req, { params: Promise.resolve({ collection: 'ghost' }) });
    expect(res.status).toBe(404);
  });

  it('creates a valid record', async () => {
    const req = await makeRequest('POST', '/api/data/example', { name: 'Nuevo', active: false });
    const res = await POST(req, { params: Promise.resolve({ collection: 'example' }) });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.id).toBeDefined();
  });

  it('rejects invalid record body', async () => {
    const req = await makeRequest('POST', '/api/data/example', { name: '', active: 'bad' });
    const res = await POST(req, { params: Promise.resolve({ collection: 'example' }) });
    expect(res.status).toBe(400);
  });

  it('updates an existing record', async () => {
    const req = await makeRequest('PUT', '/api/data/example', { id: 'ex_001', name: 'Updated', active: true });
    const res = await PUT(req, { params: Promise.resolve({ collection: 'example' }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.name).toBe('Updated');
  });

  it('deletes a record', async () => {
    const req = await makeRequest('DELETE', '/api/data/example?id=ex_001');
    const res = await DELETE(req, { params: Promise.resolve({ collection: 'example' }) });
    expect(res.status).toBe(200);
  });
});
