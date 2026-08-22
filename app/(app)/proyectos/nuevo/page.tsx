import { prisma } from "@/lib/prisma";
import { createProject } from "@/lib/actions";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatDateInput } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function NuevoProyectoPage() {
  const clients = await prisma.client.findMany({ orderBy: { name: "asc" } });

  const today = formatDateInput(new Date());
  const inThreeMonths = new Date();
  inThreeMonths.setMonth(inThreeMonths.getMonth() + 3);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Nuevo proyecto</h1>
        <p className="mt-1 text-sm text-slate-500">Completa los datos para dar de alta un proyecto.</p>
      </div>

      <Card>
        <CardHeader title="Datos del proyecto" />
        <form action={createProject} className="space-y-4 px-5 py-5">
          {clients.length === 0 ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Todavía no hay clientes cargados. Crea uno primero en la sección Clientes.
            </p>
          ) : null}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nombre del proyecto</label>
            <input name="name" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Cliente</label>
            <select name="clientId" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none">
              <option value="">Seleccionar cliente...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Descripción</label>
            <textarea name="description" rows={3} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Estado</label>
              <select name="status" defaultValue="PLANIFICACION" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none">
                <option value="PLANIFICACION">Planificación</option>
                <option value="EN_CURSO">En curso</option>
                <option value="EN_RIESGO">En riesgo</option>
                <option value="PAUSADO">Pausado</option>
                <option value="COMPLETADO">Completado</option>
              </select>
            </div>
            <div />
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Fecha de inicio</label>
              <input type="date" name="startDate" defaultValue={today} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Fecha de fin estimada</label>
              <input type="date" name="endDate" defaultValue={formatDateInput(inThreeMonths)} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Horas presupuestadas</label>
              <input type="number" name="budgetHours" min={0} step={1} defaultValue={0} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Presupuesto (CLP)</label>
              <input type="number" name="budgetAmount" min={0} step={100000} defaultValue={0} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tarifa horaria (CLP)</label>
              <input type="number" name="hourlyRate" min={0} step={1000} defaultValue={0} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="submit" className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
              Crear proyecto
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
