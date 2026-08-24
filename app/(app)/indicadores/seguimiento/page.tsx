import { prisma } from "@/lib/prisma";
import { Card, CardHeader } from "@/components/ui/Card";
import { upsertKpiMeasurement } from "@/lib/actions";
import { MONTH_LABELS, PERSPECTIVE_LABEL } from "@/lib/bsc";
import type { Perspective } from "@prisma/client";

export const dynamic = "force-dynamic";

const PERSPECTIVE_ORDER: Perspective[] = ["FINANCIERA", "CLIENTES", "PROCESOS_INTERNOS", "APRENDIZAJE_CRECIMIENTO"];

export default async function SeguimientoMensualPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const month = Math.min(12, Math.max(1, Number(params.month) || now.getMonth() + 1));
  const year = Number(params.year) || now.getFullYear();

  const objectives = await prisma.strategicObjective.findMany({
    orderBy: { order: "asc" },
    include: { measurements: { where: { month, year } } },
  });

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 1 + i);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Seguimiento mensual</h1>
        <p className="mt-1 text-sm text-slate-500">Carga el resultado real de cada indicador mes a mes.</p>
      </div>

      <Card>
        <form method="get" className="flex flex-wrap items-end gap-3 px-5 py-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Mes</label>
            <select name="month" defaultValue={month} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none">
              {MONTH_LABELS.map((label, i) => (
                <option key={label} value={i + 1}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Año</label>
            <select name="year" defaultValue={year} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none">
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200">
            Ver mes
          </button>
        </form>
      </Card>

      {PERSPECTIVE_ORDER.map((perspective) => {
        const items = objectives.filter((o) => o.perspective === perspective);
        return (
          <Card key={perspective}>
            <CardHeader title={PERSPECTIVE_LABEL[perspective]} />
            <div className="divide-y divide-slate-100">
              {items.map((obj) => {
                const measurement = obj.measurements[0];
                return (
                  <form
                    key={obj.id}
                    action={upsertKpiMeasurement}
                    className="flex flex-wrap items-end gap-3 px-5 py-4"
                  >
                    <input type="hidden" name="objectiveId" value={obj.id} />
                    <input type="hidden" name="month" value={month} />
                    <input type="hidden" name="year" value={year} />
                    <div className="min-w-[220px] flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        {obj.id} · {obj.kpiName}
                      </p>
                      <p className="text-xs text-slate-500">
                        Meta: {obj.targetValue}
                        {obj.unit} ({obj.sentido === "MAYOR" ? "mayor es mejor" : "menor es mejor"})
                      </p>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Resultado ({obj.unit})</label>
                      <input
                        type="number"
                        step="any"
                        name="resultValue"
                        defaultValue={measurement?.resultValue ?? ""}
                        className="w-28 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
                      />
                    </div>
                    <div className="min-w-[200px] flex-1">
                      <label className="mb-1 block text-xs font-medium text-slate-600">Comentario / acción correctiva</label>
                      <input
                        type="text"
                        name="comment"
                        defaultValue={measurement?.comment ?? ""}
                        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
                      />
                    </div>
                    <button type="submit" className="rounded-lg bg-brand-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark">
                      Guardar
                    </button>
                  </form>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
