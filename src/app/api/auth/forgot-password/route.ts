import { NextResponse } from 'next/server';
import {
  createAuthDatabaseClient,
  createPasswordResetToken,
  ensurePasswordResetTable,
  ensureUsersTable,
  hashPasswordResetToken,
} from '@/lib/password-reset';

const GENERIC_MESSAGE = 'Si el correo está registrado, recibirás un enlace para cambiar tu contraseña.';

export async function POST(request: Request) {
  let email: string;

  try {
    const body = (await request.json()) as { email?: string };
    email = body.email?.trim().toLowerCase() ?? '';
  } catch {
    return NextResponse.json({ success: false, error: 'Ingresa un correo válido.' }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ success: false, error: 'Ingresa un correo válido.' }, { status: 400 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;
  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (!resendApiKey || !emailFrom || (process.env.NODE_ENV === 'production' && !appUrl)) {
    return NextResponse.json(
      { success: false, error: 'El servicio de recuperación no está configurado.' },
      { status: 503 },
    );
  }

  let client;
  try {
    client = createAuthDatabaseClient();
    await client.connect();
    await ensureUsersTable(client);
    await ensurePasswordResetTable(client);

    const result = await client.query(
      'select id, email from public.users where lower(email) = $1 and is_active = true limit 1',
      [email],
    );
    const user = result.rows[0] as { id: string; email: string } | undefined;

    if (user) {
      const token = createPasswordResetToken();
      const tokenHash = hashPasswordResetToken(token);

      await client.query('begin');
      await client.query('delete from public.password_reset_tokens where user_id = $1', [user.id]);
      await client.query(
        `insert into public.password_reset_tokens (token_hash, user_id, expires_at)
         values ($1, $2, now() + interval '30 minutes')`,
        [tokenHash, user.id],
      );
      await client.query('commit');

      const resetUrl = new URL('/reset-password', appUrl ?? new URL(request.url).origin);
      resetUrl.searchParams.set('token', token);
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: emailFrom,
          to: [user.email],
          subject: 'Restablece tu contraseña de BALI',
          html: `<p>Recibimos una solicitud para cambiar tu contraseña de BALI.</p><p><a href="${resetUrl.toString()}">Crear una nueva contraseña</a></p><p>El enlace vence en 30 minutos. Si no solicitaste este cambio, puedes ignorar este correo.</p>`,
          text: `Para cambiar tu contraseña de BALI, abre este enlace (vence en 30 minutos): ${resetUrl.toString()}. Si no solicitaste este cambio, ignora este correo.`,
        }),
      });

      if (!emailResponse.ok) {
        await client.query('delete from public.password_reset_tokens where token_hash = $1', [tokenHash]);
        throw new Error('Email provider rejected the request');
      }
    }

    return NextResponse.json({ success: true, message: GENERIC_MESSAGE });
  } catch (error) {
    console.error('Password recovery error:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo procesar la solicitud. Inténtalo de nuevo.' },
      { status: 500 },
    );
  } finally {
    if (client) await client.end().catch(() => undefined);
  }
}