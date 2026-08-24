import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import {
  computeCompliance,
  computeEstado,
  ESTADO_COLOR,
  ESTADO_LABEL,
  PERSPECTIVE_COLOR,
  PERSPECTIVE_LABEL,
  type Estado,
} from "@/lib/bsc";
import type { Perspective } from "@prisma/client";

export const dynamic = "force-dynamic";

const PERSPECTIVE_ORDER: Perspective[] = ["FINANCIERA", "CLIENTES", "PROCESOS_INTERNOS", "APRENDIZAJE_CRECIMIENTO"];

export default async function IndicadoresPage() {
  const objectives = await prisma.strategicObjective.findMany({
    orderBy: { order: "asc" },
    include: { measurements: true },
  });

  const rows = objectives.map((obj) => {
    const withResult = obj.measurements
      .filter((m) => m.resultValue !== null)
      .sort((a, b) => b.year - a.year || b.month - a.month);
    const latest = withResult[0] ?? null;
    const compliance = latest ? computeCompliance(latest.resultValue, obj.targetValue, obj.sentido) : null;
    const estado = computeEstado(compliance);
    return { obj, latest, compliance, estado };
  });

  const conDato = rows.filter((r) => r.latest !== null).length;
  const verdes = rows.filter((r) => r.estado === "VERDE").length;
  const amarillos = rows.filter((r) => r.estado === "AMARILLO").length;
  const rojos = rows.filter((r) => r.estado === "ROJO").length;

  const perspectives = PERSPECTIVE_ORDER.map((p) => {
    const items = rows.filter((r) => r.obj.perspective === p);
    const withCompliance = items.filter((r) => r.compliance !== null);
    const avg = withCompliance.length > 0 ? withCompliance.reduce((s, r) => s + (r.compliance ?? 0), 0) / withCompliance.length : null;
    return { perspective: p, avg, estado: computeEstado(avg), count: items.length, conDato: withCompliance.length };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Indicadores (BSC)</h1>
          <p className="mt-1 text-sm text-slate-500">Balanced Scorecard estratégico de EducaMente.</p>
        </div>
        <Link href="/indicadores/seguimiento" className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
          Cargar resultado mensual
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="KPIs totales" value={String(rows.length)} hint="Indicadores estratégicos" />
        <StatCard label="KPIs con resultado" value={String(conDato)} hint="Cobertura de medición" />
        <StatCard label="En meta" value={String(verdes)} tone={verdes > 0 ? "success" : "default"} hint="Cumplimiento ≥ 90%" />
        <StatCard label="Bajo meta" value={String(rojos)} tone={rojos > 0 ? "danger" : "default"} hint={`${amarillos} en riesgo (70-89%)`} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {perspectives.map((p) => (
          <Card key={p.perspective} className="p-5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PERSPECTIVE_COLOR[p.perspective] }} />
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{PERSPECTIVE_LABEL[p.perspective]}</p>
            </div>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{p.avg !== null ? `${p.avg.toFixed(0)}%` : "—"}</p>
            <p className="mt-1 text-xs text-slate-500">{p.conDato} de {p.count} con dato</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Objetivos estratégicos" subtitle="Resultado más reciente cargado por indicador" />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Objetivo / KPI</th>
                <th className="px-5 py-3 font-medium">Meta</th>
                <th className="px-5 py-3 font-medium">Resultado</th>
                <th className="px-5 py-3 font-medium">Cumplimiento</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(({ obj, latest, compliance, estado }) => (
                <tr key={obj.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-500">{obj.id}</td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">{obj.objective}</p>
                    <p className="text-xs text-slate-500">{obj.kpiName}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {obj.targetValue}
                    {obj.unit}
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {latest?.resultValue !== undefined && latest?.resultValue !== null ? `${latest.resultValue}${obj.unit}` : "—"}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{compliance !== null ? `${compliance.toFixed(0)}%` : "—"}</td>
                  <td className="px-5 py-3">
                    <Badge className={ESTADO_COLOR[estado as Estado]}>{ESTADO_LABEL[estado as Estado]}</Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{obj.responsible}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
