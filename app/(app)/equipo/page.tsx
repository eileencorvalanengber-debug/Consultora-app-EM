import { prisma } from "@/lib/prisma";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { createTeamMember } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function EquipoPage() {
  const members = await prisma.teamMember.findMany({
    where: { active: true },
    include: { assignments: { include: { project: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Equipo</h1>
        <p className="mt-1 text-sm text-slate-500">{members.length} consultor(es) activo(s)</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Carga de trabajo" subtitle="Horas semanales asignadas en proyectos activos vs. capacidad" />
          <div className="divide-y divide-slate-100">
            {members.map((m) => {
              const activeLoad = m.assignments
                .filter((a) => a.project.status === "EN_CURSO" || a.project.status === "EN_RIESGO")
                .reduce((s, a) => s + a.allocationHoursPerWeek, 0);
              const pct = m.weeklyCapacityHours > 0 ? (activeLoad / m.weeklyCapacityHours) * 100 : 0;
              const overloaded = activeLoad > m.weeklyCapacityHours;
              return (
                <div key={m.id} className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{m.name}</p>
                      <p className="text-xs text-slate-500">{m.role}</p>
                    </div>
                    <p className={`text-sm font-medium ${overloaded ? "text-red-600" : "text-slate-600"}`}>
                      {activeLoad.toFixed(0)}h / {m.weeklyCapacityHours.toFixed(0)}h semana
                    </p>
                  </div>
                  <ProgressBar value={pct} className="mt-2" />
                  {overloaded && <p className="mt-1 text-xs font-medium text-red-600">Sobrecargado/a</p>}
                </div>
              );
            })}
            {members.length === 0 && <p className="px-5 py-10 text-center text-sm text-slate-500">Todavía no hay consultores cargados.</p>}
          </div>
        </Card>

        <Card>
          <CardHeader title="Nuevo consultor/a" />
          <form action={createTeamMember} className="space-y-3 px-5 py-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Nombre</label>
              <input name="name" required className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Rol</label>
              <input name="role" placeholder="Ej: Consultor Senior" className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
              <input type="email" name="email" className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Capacidad semanal (horas)</label>
              <input type="number" name="weeklyCapacityHours" min={0} step={1} defaultValue={40} className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none" />
            </div>
            <button type="submit" className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
              Agregar al equipo
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
