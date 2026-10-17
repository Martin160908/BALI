'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';

export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const payload = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !payload.success) {
        setError(payload.error ?? 'No se pudo cambiar la contraseña. Inténtalo de nuevo.');
        return;
      }
      setIsComplete(true);
    } catch {
      setError('No se pudo cambiar la contraseña. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isComplete) {
    return (
      <div className="mt-8 space-y-5">
        <p className="text-sm text-[#315f37]" role="status">Tu contraseña se cambió correctamente.</p>
        <Link href="/login" className="inline-block font-semibold text-[#456b43] underline-offset-4 hover:underline">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="mt-8 space-y-5">
        <p className="text-sm text-[#a3352a]" role="alert">Este enlace no es válido. Solicita uno nuevo.</p>
        <Link href="/forgot-password" className="inline-block font-semibold text-[#456b43] underline-offset-4 hover:underline">
          Solicitar otro enlace
        </Link>
      </div>
    );
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-semibold">Nueva contraseña</label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-12 w-full rounded-lg border border-[#cbd2c8] bg-white px-4 text-base outline-none focus:border-[#447342] focus:ring-2 focus:ring-[#447342]/20"
        />
      </div>
      <div>
        <label htmlFor="confirmation" className="mb-2 block text-sm font-semibold">Repite la contraseña</label>
        <input
          id="confirmation"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          className="h-12 w-full rounded-lg border border-[#cbd2c8] bg-white px-4 text-base outline-none focus:border-[#447342] focus:ring-2 focus:ring-[#447342]/20"
        />
      </div>
      {error && <p className="text-sm text-[#a3352a]" role="alert">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="h-12 w-full rounded-lg bg-[#193c28] px-4 text-sm font-semibold text-white transition hover:bg-[#245437] disabled:cursor-not-allowed disabled:opacity-65"
      >
        {isSubmitting ? 'Guardando...' : 'Cambiar contraseña'}
      </button>
    </form>
  );
}