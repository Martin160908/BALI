import fs from 'node:fs/promises';
import path from 'node:path';
import { getSchema } from '@data/_schema/registry';
import type { BaseRecord, CollectionFile, QueryResult } from './types';
import { deepClone, generateId, now, safeJsonParse } from './utils';

export class JsonDBError extends Error {
  public readonly code: 'NOT_FOUND' | 'DUPLICATE_ID' | 'VALIDATION_ERROR' | 'IO_ERROR';

  constructor(code: 'NOT_FOUND' | 'DUPLICATE_ID' | 'VALIDATION_ERROR' | 'IO_ERROR', message: string) {
    super(message);
    this.name = 'JsonDBError';
    this.code = code;
  }
}

export class ReadOnlyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReadOnlyError';
  }
}

export interface JsonDBOptions {
  dataDir?: string;
}

export class JsonDB {
  private readonly dataDir: string;
  private readonly lockMap = new Map<string, Promise<void>>();

  constructor(options: JsonDBOptions = {}) {
    this.dataDir = options.dataDir ?? path.resolve(process.cwd(), 'data');
  }

  private resolveCollectionPath(collection: string): string {
    return path.join(this.dataDir, `${collection}.json`);
  }

  private async ensureCollectionFile(collection: string): Promise<void> {
    const resolved = this.resolveCollectionPath(collection);
    await fs.mkdir(path.dirname(resolved), { recursive: true });
    try {
      await fs.access(resolved);
    } catch {
      const empty: CollectionFile = {
        _meta: {
          version: 1,
          lastModified: now(),
          description: `Collection ${collection}`,
        },
        records: [],
      };
      await fs.writeFile(resolved, JSON.stringify(empty, null, 2));
    }
  }

  private async withLock<T>(collection: string, action: () => Promise<T>): Promise<T> {
    const previous = this.lockMap.get(collection) ?? Promise.resolve();
    const next = previous.then(action, action);
    this.lockMap.set(collection, next.then(() => undefined, () => undefined));
    return next;
  }

  private async backup(collection: string): Promise<void> {
    const filePath = this.resolveCollectionPath(collection);
    const backupDir = path.join(this.dataDir, '_backups');
    await fs.mkdir(backupDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `${collection}_${timestamp}.json`);
    await fs.copyFile(filePath, backupPath).catch(() => undefined);
  }

  private async readCollection<T extends BaseRecord>(collection: string): Promise<CollectionFile<T>> {
    await this.ensureCollectionFile(collection);
    const filePath = this.resolveCollectionPath(collection);
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = safeJsonParse<CollectionFile<T>>(raw);

    if (!parsed || !Array.isArray(parsed.records)) {
      throw new JsonDBError('IO_ERROR', `Invalid collection file for ${collection}`);
    }

    const schema = getSchema(collection);
    if (schema) {
      const valid = schema.array().safeParse(parsed.records);
      if (!valid.success) {
        throw new JsonDBError('VALIDATION_ERROR', valid.error.message);
      }
    }

    return parsed;
  }

  private async writeCollection<T extends BaseRecord>(collection: string, data: CollectionFile<T>): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new ReadOnlyError('Writes are disabled in production mode.');
    }

    const filePath = this.resolveCollectionPath(collection);
    await this.backup(collection);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  async getAll<T extends BaseRecord>(collection: string, options?: { limit?: number; offset?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }): Promise<QueryResult<T>> {
    const file = await this.readCollection<T>(collection);
    const records = [...file.records];

    if (options?.sortBy) {
      records.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[options.sortBy as string];
        const bVal = (b as Record<string, unknown>)[options.sortBy as string];
        const left = String(aVal ?? '');
        const right = String(bVal ?? '');
        return options.sortOrder === 'desc' ? right.localeCompare(left) : left.localeCompare(right);
      });
    }

    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? records.length;
    const paginated = records.slice(offset, offset + limit);

    return {
      data: paginated,
      total: records.length,
      limit,
      offset,
    };
  }

  async getById<T extends BaseRecord>(collection: string, id: string): Promise<T | null> {
    const file = await this.readCollection<T>(collection);
    return file.records.find((record) => record.id === id) ?? null;
  }

  async create<T extends BaseRecord>(collection: string, input: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const schema = getSchema(collection);
    const prefix = collection.slice(0, 2).toLowerCase() || 'id';
    const payload = {
      ...input,
      id: `${prefix}_${crypto.randomUUID().split('-')[0]}`,
      createdAt: now(),
      updatedAt: now(),
    } as T;

    if (schema) {
      const valid = schema.safeParse(payload);
      if (!valid.success) {
        throw new JsonDBError('VALIDATION_ERROR', valid.error.message);
      }
    }

    return this.withLock(collection, async () => {
      const file = await this.readCollection<T>(collection);
      if (file.records.some((record) => record.id === payload.id)) {
        throw new JsonDBError('DUPLICATE_ID', `ID already exists: ${payload.id}`);
      }
      file.records.push(payload);
      file._meta.lastModified = now();
      await this.writeCollection(collection, file);
      return deepClone(payload);
    });
  }

  async update<T extends BaseRecord>(collection: string, id: string, partial: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<T | null> {
    return this.withLock(collection, async () => {
      const file = await this.readCollection<T>(collection);
      const recordIndex = file.records.findIndex((record) => record.id === id);

      if (recordIndex === -1) {
        return null;
      }

      const existing = file.records[recordIndex];
      const updated = {
        ...existing,
        ...partial,
        updatedAt: now(),
      } as T;

      const schema = getSchema(collection);
      if (schema) {
        const valid = schema.safeParse(updated);
        if (!valid.success) {
          throw new JsonDBError('VALIDATION_ERROR', valid.error.message);
        }
      }

      file.records[recordIndex] = updated;
      file._meta.lastModified = now();
      await this.writeCollection(collection, file);
      return deepClone(updated);
    });
  }

  async remove(collection: string, id: string): Promise<boolean> {
    return this.withLock(collection, async () => {
      const file = await this.readCollection<BaseRecord>(collection);
      const initialCount = file.records.length;
      file.records = file.records.filter((record) => record.id !== id);

      if (file.records.length === initialCount) {
        return false;
      }

      file._meta.lastModified = now();
      await this.writeCollection(collection, file as CollectionFile<BaseRecord>);
      return true;
    });
  }

  async query<T extends BaseRecord>(collection: string, predicate: (record: T) => boolean): Promise<T[]> {
    const file = await this.readCollection<T>(collection);
    return file.records.filter(predicate);
  }

  async count(collection: string): Promise<number> {
    const file = await this.readCollection<BaseRecord>(collection);
    return file.records.length;
  }
}
