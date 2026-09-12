import { ZodSchema } from 'zod';
import { exampleCreateSchema, exampleRecordSchema, exampleUpdateSchema } from './example.schema';

export const schemaRegistry: Record<string, ZodSchema> = {
  example: exampleRecordSchema,
};

export const createSchemaRegistry: Record<string, ZodSchema> = {
  example: exampleCreateSchema,
};

export const updateSchemaRegistry: Record<string, ZodSchema> = {
  example: exampleUpdateSchema,
};

export function getSchema(collection: string): ZodSchema | null {
  return schemaRegistry[collection] ?? null;
}

export function getCreateSchema(collection: string): ZodSchema | null {
  return createSchemaRegistry[collection] ?? null;
}

export function getUpdateSchema(collection: string): ZodSchema | null {
  return updateSchemaRegistry[collection] ?? null;
}
