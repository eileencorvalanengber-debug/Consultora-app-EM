import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader } from "@/components/ui/Card";
import { updateStrategicObjective } from "@/lib/actions";
import { PERSPECTIVE_LABEL } from "@/lib/bsc";

export const dynamic = "force-dynamic";

export default async function EditarIndicadorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const objective = await prisma.strategicObjective.findUnique({ where: { id } });
  if (!objective) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {objective.id} · {PERSPECTIVE_LABEL[objective.perspective]}
        </p>
        <h1 className="text-xl font-semibold text-slate-900">Editar indicador</h1>
        <p className="mt-1 text-sm text-slate-500">Ajustá el objetivo, la meta u otros datos a medida que evolucione la estrategia.</p>
      </div>

      <Card>
        <CardHeader title="Datos del indicador" />
        <form action={updateStrategicObjective} className="space-y-4 px-5 py-5">
          <input type="hidden" name="objectiveId" value={objective.id} />

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Objetivo estratégico</label>
            <input name="objective" required defaultValue={objective.objective} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">KPI</label>
            <input name="kpiName" required defaultValue={objective.kpiName} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Meta 12M</label>
              <input type="number" step="any" name="targetValue" required defaultValue={objective.targetValue} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Unidad</label>
              <input name="unit" required defaultValue={objective.unit} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Sentido</label>
              <select name="sentido" defaultValue={objective.sentido} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none">
                <option value="MAYOR">Mayor es mejor</option>
                <option value="MENOR">Menor es mejor</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Frecuencia</label>
              <input name="frequency" defaultValue={objective.frequency} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Responsable</label>
              <input name="responsible" defaultValue={objective.responsible} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Justificación</label>
            <textarea name="justification" rows={3} defaultValue={objective.justification ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Iniciativa prioritaria</label>
            <input name="priorityInitiative" defaultValue={objective.priorityInitiative ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="submit" className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
              Guardar cambios
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
