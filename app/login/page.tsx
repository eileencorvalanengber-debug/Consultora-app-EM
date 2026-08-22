import Image from "next/image";
import { login } from "@/lib/auth-actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const { from, error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <Image src="/brand/logo_icon.png" alt="EDUCAMENTE" width={32} height={29} className="h-8 w-auto" priority />
          <div>
            <p className="text-sm font-semibold text-slate-900">EDUCAMENTE</p>
            <p className="text-xs text-slate-500">Gestión de proyectos</p>
          </div>
        </div>

        <h1 className="text-base font-semibold text-slate-900">Ingresar</h1>
        <p className="mt-1 text-sm text-slate-500">Ingresa la contraseña compartida del equipo para continuar.</p>

        <form action={login} className="mt-4 space-y-3">
          <input type="hidden" name="from" value={from ?? "/"} />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Contraseña</label>
            <input
              type="password"
              name="password"
              autoFocus
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-red-600">Contraseña incorrecta. Prueba de nuevo.</p>}
          <button type="submit" className="w-full rounded-lg bg-brand-primary px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark">
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
