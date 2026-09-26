'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type FieldErrors = {
  email?: string | undefined;
  password?: string | undefined;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FieldErrors = {};
    const normalizedEmail = email.trim();
    if (
      normalizedEmail !== 'demo@BALI-com' &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      nextErrors.email = 'Ingresa un correo válido.';
    }
    if (!password.trim()) {
      nextErrors.password = 'Ingresa tu contraseña.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);

    // TODO: conectar con la API real.
    await new Promise((resolve) => setTimeout(resolve, 700));

    if (normalizedEmail === 'demo@BALI-com' && password === 'demo1234') {
      window.sessionStorage.setItem('bali-demo-authenticated', 'true');
      router.push('/');
      return;
    }

    setErrors({ password: 'Correo o contraseña incorrectos.' });
    setIsSubmitting(false);
  }

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#0b1713] text-[#f4f4ec]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(215,239,220,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(215,239,220,0.12)_1px,transparent_1px)] [background-size:48px_48px]"
      />

      <section className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-white/10 px-12 py-10 lg:flex xl:px-20">
        <Link href="/" className="flex w-fit items-center gap-3" aria-label="BALI, inicio">
          <span className="grid size-10 place-items-center rounded-xl bg-[#c4f06b] text-lg font-black text-[#142016]">
            B
          </span>
          <span className="text-lg font-semibold tracking-[0.18em]">BALI</span>
        </Link>

        <div className="relative z-10 max-w-xl pb-10">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#c4f06b]">
            Finanzas con intención
          </p>
          <h1 className="text-5xl font-semibold leading-[1.08] xl:text-6xl">
            Tu dinero, <span className="text-[#c4f06b]">en movimiento.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-[#b4c1b7]">
            Un paso a la vez hacia una vida financiera más clara y tranquila.
          </p>
        </div>

        <div className="flex items-center gap-3 text-sm text-[#9eafa3]">
          <span aria-hidden="true" className="h-px w-8 bg-[#c4f06b]" />
          Claridad para elegir. Confianza para avanzar.
        </div>
        <div
          aria-hidden="true"
          className="absolute -bottom-32 -right-20 size-[28rem] rounded-full border border-[#c4f06b]/10"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-20 -right-8 size-[20rem] rounded-full border border-[#c4f06b]/10"
        />
      </section>

      <section className="relative flex min-h-screen w-full items-center justify-center bg-[#f2f3eb] px-5 py-10 text-[#17231b] sm:px-10 lg:w-1/2 lg:px-12">
        <Link
          href="/"
          className="absolute left-6 top-6 flex items-center gap-2.5 lg:hidden"
          aria-label="BALI, inicio"
        >
          <span className="grid size-9 place-items-center rounded-lg bg-[#17231b] font-black text-[#c4f06b]">
            B
          </span>
          <span className="text-sm font-bold tracking-[0.18em]">BALI</span>
        </Link>

        <div className="w-full max-w-md pt-12 lg:pt-0">
          <div className="mb-9">
            <p className="mb-3 text-sm font-semibold text-[#63776a]">Qué bueno verte de nuevo</p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Inicia sesión</h2>
            <p className="mt-3 text-sm leading-6 text-[#637067]">
              Entra a tu espacio y sigue avanzando con tus finanzas.
            </p>
          </div>

          <form className="space-y-5" noValidate onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="nombre@correo.com"
                value={email}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setErrors((current) => ({ ...current, email: undefined }));
                }}
                className="h-12 w-full rounded-lg border border-[#cbd2c8] bg-white px-4 text-base text-[#17231b] outline-none transition placeholder:text-[#929c92] focus:border-[#447342] focus:ring-2 focus:ring-[#447342]/20 aria-[invalid=true]:border-[#b64335]"
              />
              {errors.email && (
                <p id="email-error" className="mt-2 text-sm text-[#a3352a]" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="password" className="text-sm font-semibold">
                  Contraseña
                </label>
                <a
                  href="#"
                  onClick={(event) => event.preventDefault()}
                  className="text-sm font-semibold text-[#456b43] underline-offset-4 hover:underline"
                >
                  Olvidé mi contraseña
                </a>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Tu contraseña"
                value={password}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : undefined}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrors((current) => ({ ...current, password: undefined }));
                }}
                className="h-12 w-full rounded-lg border border-[#cbd2c8] bg-white px-4 text-base text-[#17231b] outline-none transition placeholder:text-[#929c92] focus:border-[#447342] focus:ring-2 focus:ring-[#447342]/20 aria-[invalid=true]:border-[#b64335]"
              />
              {errors.password && (
                <p id="password-error" className="mt-2 text-sm text-[#a3352a]" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center rounded-lg bg-[#193c28] px-4 text-sm font-semibold text-white transition hover:bg-[#245437] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#456b43] disabled:cursor-not-allowed disabled:opacity-65"
            >
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="mt-8 border-t border-[#d8ddd4] pt-5 text-xs leading-5 text-[#758076]">
            Tus decisiones financieras empiezan con un buen paso.
          </p>
        </div>
      </section>
    </main>
  );
}