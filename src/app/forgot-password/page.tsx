'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json()) as { success?: boolean; message?: string; error?: string };
      if (!response.ok || !payload.success) {
        setError(payload.error ?? 'No se pudo enviar la solicitud. Inténtalo de nuevo.');
        return;
      }
      setMessage(payload.message ?? 'Si el correo está registrado, recibirás un enlace para cambiar tu contraseña.');
    } catch {
      setError('No se pudo enviar la solicitud. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f2f3eb] px-5 py-12 text-[#17231b]">
      <section className="w-full max-w-md">
        <Link href="/" className="mb-12 flex w-fit items-center gap-2.5" aria-label="BALI, inicio">
          <span className="grid size-10 place-items-center rounded-xl bg-[#17231b] text-lg font-black text-[#c4f06b]">B</span>
          <span className="text-lg font-semibold tracking-[0.18em]">BALI</span>
        </Link>
        <p className="mb-3 text-sm font-semibold text-[#63776a]">Recupera el acceso a tu cuenta</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">¿Olvidaste tu contraseña?</h1>
        <p className="mt-3 text-sm leading-6 text-[#637067]">
          Ingresa el correo asociado a tu cuenta y te enviaremos un enlace para crear una nueva.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold">Correo electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nombre@correo.com"
              className="h-12 w-full rounded-lg border border-[#cbd2c8] bg-white px-4 text-base outline-none focus:border-[#447342] focus:ring-2 focus:ring-[#447342]/20"
            />
          </div>
          {error && <p className="text-sm text-[#a3352a]" role="alert">{error}</p>}
          {message && <p className="text-sm text-[#315f37]" role="status">{message}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full rounded-lg bg-[#193c28] px-4 text-sm font-semibold text-white transition hover:bg-[#245437] disabled:cursor-not-allowed disabled:opacity-65"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>
        <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-[#456b43] underline-offset-4 hover:underline">
          Volver a iniciar sesión
        </Link>
      </section>
    </main>
  );
}