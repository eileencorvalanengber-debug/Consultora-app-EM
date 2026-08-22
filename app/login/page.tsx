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
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
            C
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Consultora</p>
            <p className="text-xs text-slate-500">Gestión de proyectos</p>
          </div>
        </div>

        <h1 className="text-base font-semibold text-slate-900">Ingresar</h1>
        <p className="mt-1 text-sm text-slate-500">Ingresá la contraseña compartida del equipo para continuar.</p>

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
          {error && <p className="text-sm text-red-600">Contraseña incorrecta. Probá de nuevo.</p>}
          <button type="submit" className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
