import { NextResponse } from 'next/server';
import { getCreateSchema, getSchema, getUpdateSchema } from '@data/_schema/registry';
import { JsonDB, JsonDBError } from '@/lib/json-db';

function getDb() {
  return new JsonDB({ dataDir: process.env.DATA_DIR ?? './data' });
}

function standardError(message: string, code: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

export async function GET(request: Request, { params }: { params: Promise<{ collection: string }> }) {
  const { collection } = await params;
  if (!getSchema(collection)) {
    return standardError(`Collection not found: ${collection}`, 'NOT_FOUND', 404);
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  const db = getDb();

  if (id) {
    const item = await db.getById(collection, id);
    if (!item) {
      return standardError('Record not found', 'NOT_FOUND', 404);
    }
    return NextResponse.json({ success: true, data: item, timestamp: new Date().toISOString() });
  }

  const limit = Number(url.searchParams.get('limit') ?? '50');
  const offset = Number(url.searchParams.get('offset') ?? '0');
  const sortBy = url.searchParams.get('sortBy');
  const sortOrder = url.searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc';

  const getAllOptions: { limit: number; offset: number; sortOrder: 'asc' | 'desc'; sortBy?: string } = {
    limit,
    offset,
    sortOrder,
  };

  if (sortBy) {
    getAllOptions.sortBy = sortBy;
  }

  const result = await db.getAll(collection, getAllOptions);
  return NextResponse.json({ success: true, data: result.data, timestamp: new Date().toISOString() });
}

export async function POST(request: Request, { params }: { params: Promise<{ collection: string }> }) {
  const { collection } = await params;
  const schema = getSchema(collection);
  if (!schema) {
    return standardError(`Collection not found: ${collection}`, 'NOT_FOUND', 404);
  }

  try {
    const db = getDb();
    const body = await request.json();
    const createSchema = getCreateSchema(collection) ?? schema;
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return standardError(parsed.error.message, 'VALIDATION_ERROR', 400);
    }

    const created = await db.create(collection, parsed.data as never);
    return NextResponse.json(
      { success: true, data: created, timestamp: new Date().toISOString() },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof JsonDBError) {
      return standardError(error.message, error.code, 400);
    }
    return standardError('Failed to create record', 'IO_ERROR', 500);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ collection: string }> }) {
  const { collection } = await params;
  if (!getSchema(collection)) {
    return standardError(`Collection not found: ${collection}`, 'NOT_FOUND', 404);
  }

  try {
    const db = getDb();
    const body = await request.json();
    const updateSchema = getUpdateSchema(collection) ?? getSchema(collection)!;
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return standardError(parsed.error.message, 'VALIDATION_ERROR', 400);
    }

    const data = parsed.data as { id: string } & Record<string, unknown>;
    const updated = await db.update(collection, data.id, data as never);
    if (!updated) {
      return standardError('Record not found', 'NOT_FOUND', 404);
    }

    return NextResponse.json({ success: true, data: updated, timestamp: new Date().toISOString() });
  } catch (error) {
    if (error instanceof JsonDBError) {
      return standardError(error.message, error.code, 400);
    }
    return standardError('Failed to update record', 'IO_ERROR', 500);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ collection: string }> }) {
  const { collection } = await params;
  if (!getSchema(collection)) {
    return standardError(`Collection not found: ${collection}`, 'NOT_FOUND', 404);
  }

  const db = getDb();
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return standardError('Missing id query parameter', 'VALIDATION_ERROR', 400);
  }

  const removed = await db.remove(collection, id);
  if (!removed) {
    return standardError('Record not found', 'NOT_FOUND', 404);
  }

  return NextResponse.json({ success: true, data: { id }, timestamp: new Date().toISOString() });
}
