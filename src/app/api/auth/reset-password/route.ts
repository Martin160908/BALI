import { NextResponse } from 'next/server';
import {
  createAuthDatabaseClient,
  ensurePasswordResetTable,
  ensureUsersTable,
  hashPassword,
  hashPasswordResetToken,
} from '@/lib/password-reset';

export async function POST(request: Request) {
  let body: { token?: string; password?: string };
  try {
    body = (await request.json()) as { token?: string; password?: string };
  } catch {
    return NextResponse.json({ success: false, error: 'La solicitud no es válida.' }, { status: 400 });
  }

  const token = body.token?.trim() ?? '';
  const password = body.password ?? '';
  if (token.length < 40 || password.length < 8) {
    return NextResponse.json(
      { success: false, error: 'El enlace no es válido o la contraseña tiene menos de 8 caracteres.' },
      { status: 400 },
    );
  }

  let client;
  try {
    client = createAuthDatabaseClient();
    await client.connect();
    await ensureUsersTable(client);
    await ensurePasswordResetTable(client);
    await client.query('begin');

    const result = await client.query(
      `select user_id from public.password_reset_tokens
       where token_hash = $1 and expires_at > now() for update`,
      [hashPasswordResetToken(token)],
    );
    const userId = result.rows[0]?.user_id as string | undefined;
    if (!userId) {
      await client.query('rollback');
      return NextResponse.json(
        { success: false, error: 'El enlace venció o ya fue utilizado. Solicita uno nuevo.' },
        { status: 400 },
      );
    }

    const updated = await client.query(
      'update public.users set password_hash = $1 where id = $2 and is_active = true',
      [hashPassword(password), userId],
    );
    if (updated.rowCount !== 1) {
      await client.query('rollback');
      return NextResponse.json(
        { success: false, error: 'El enlace venció o ya fue utilizado. Solicita uno nuevo.' },
        { status: 400 },
      );
    }

    await client.query('delete from public.password_reset_tokens where user_id = $1', [userId]);
    await client.query('commit');
    return NextResponse.json({ success: true });
  } catch (error) {
    if (client) await client.query('rollback').catch(() => undefined);
    console.error('Password reset error:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo cambiar la contraseña. Inténtalo de nuevo.' },
      { status: 500 },
    );
  } finally {
    if (client) await client.end().catch(() => undefined);
  }
}