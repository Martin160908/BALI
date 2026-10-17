import Link from 'next/link';
import ResetPasswordForm from './reset-password-form';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f2f3eb] px-5 py-12 text-[#17231b]">
      <section className="w-full max-w-md">
        <Link href="/" className="mb-12 flex w-fit items-center gap-2.5" aria-label="BALI, inicio">
          <span className="grid size-10 place-items-center rounded-xl bg-[#17231b] text-lg font-black text-[#c4f06b]">B</span>
          <span className="text-lg font-semibold tracking-[0.18em]">BALI</span>
        </Link>
        <p className="mb-3 text-sm font-semibold text-[#63776a]">Un paso más para recuperar tu cuenta</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">Crea una nueva contraseña</h1>
        <p className="mt-3 text-sm leading-6 text-[#637067]">Usa al menos 8 caracteres.</p>
        <ResetPasswordForm token={token ?? ''} />
      </section>
    </main>
  );
}