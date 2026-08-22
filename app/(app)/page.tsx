import { prisma } from "@/lib/prisma";
import { getAlerts } from "@/lib/alerts";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { AlertsList } from "@/components/AlertsList";
import { ProjectsTable, type ProjectRow } from "@/components/ProjectsTable";
import { StatusDonutChart } from "@/components/charts/StatusDonutChart";
import { BudgetUsageChart } from "@/components/charts/BudgetUsageChart";
import { formatCurrency, formatHours } from "@/lib/format";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  PLANIFICACION: "#94a3b8",
  EN_CURSO: "#2563eb",
  EN_RIESGO: "#dc2626",
  PAUSADO: "#d97706",
  COMPLETADO: "#059669",
};

const STATUS_LABELS: Record<string, string> = {
  PLANIFICACION: "Planificación",
  EN_CURSO: "En curso",
  EN_RIESGO: "En riesgo",
  PAUSADO: "Pausado",
  COMPLETADO: "Completado",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [projects, alerts] = await Promise.all([
    prisma.project.findMany({
      include: { client: true, timeEntries: true },
      orderBy: { endDate: "asc" },
    }),
    getAlerts(),
  ]);

  const activeProjects = projects.filter((p) => p.status !== "COMPLETADO");
  const atRiskProjects = projects.filter((p) => p.status === "EN_RIESGO");

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const hoursLast30d = projects
    .flatMap((p) => p.timeEntries)
    .filter((e) => e.date >= thirtyDaysAgo)
    .reduce((s, e) => s + e.hours, 0);

  const estimatedRevenue = projects.reduce((sum, p) => {
    const billable = p.timeEntries.filter((e) => e.billable).reduce((s, e) => s + e.hours, 0);
    return sum + billable * p.hourlyRate;
  }, 0);

  const criticalAlerts = alerts.filter((a) => a.severity === "critica").length;

  const statusCounts = Object.keys(STATUS_LABELS).map((status) => ({
    name: STATUS_LABELS[status],
    value: projects.filter((p) => p.status === status).length,
    color: STATUS_COLORS[status],
  }));

  const budgetChartData = activeProjects
    .filter((p) => p.budgetHours > 0)
    .map((p) => {
      const used = p.timeEntries.reduce((s, e) => s + e.hours, 0);
      return { name: p.name, used, budget: p.budgetHours, usedPct: (used / p.budgetHours) * 100 };
    })
    .sort((a, b) => b.usedPct - a.usedPct)
    .slice(0, 6);

  const projectRows: ProjectRow[] = activeProjects.slice(0, 6).map((p) => ({
    id: p.id,
    name: p.name,
    clientName: p.client.name,
    status: p.status,
    endDate: p.endDate,
    progressPercent: p.progressPercent,
    hoursUsed: p.timeEntries.reduce((s, e) => s + e.hours, 0),
    budgetHours: p.budgetHours,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Panorama general de los proyectos de la consultora.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Proyectos activos" value={String(activeProjects.length)} hint={`${projects.length} en total`} />
        <StatCard
          label="Proyectos en riesgo"
          value={String(atRiskProjects.length)}
          tone={atRiskProjects.length > 0 ? "danger" : "success"}
          hint="Marcados manualmente como en riesgo"
        />
        <StatCard label="Horas cargadas (30 días)" value={formatHours(hoursLast30d)} hint="Todos los proyectos" />
        <StatCard
          label="Alertas críticas"
          value={String(criticalAlerts)}
          tone={criticalAlerts > 0 ? "danger" : "success"}
          hint={`${alerts.length} alerta(s) en total`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Alertas" subtitle="Vencimientos, presupuesto, inactividad y carga del equipo" action={<Link href="/proyectos" className="text-xs font-medium text-blue-600 hover:underline">Ver proyectos</Link>} />
          <div className="max-h-96 overflow-y-auto">
            <AlertsList alerts={alerts} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Proyectos por estado" />
          <StatusDonutChart data={statusCounts} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Consumo de horas presupuestadas" subtitle="Proyectos activos con mayor consumo relativo" />
          <div className="px-2 py-4">
            <BudgetUsageChart data={budgetChartData} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Facturación estimada" subtitle="Horas facturables × tarifa horaria" />
          <div className="flex h-[240px] flex-col items-center justify-center gap-2 px-5">
            <p className="text-3xl font-semibold text-slate-900">{formatCurrency(estimatedRevenue)}</p>
            <p className="text-center text-xs text-slate-500">Acumulado de todos los proyectos según horas cargadas</p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Próximos vencimientos" subtitle="Proyectos activos ordenados por fecha de fin" action={<Link href="/proyectos" className="text-xs font-medium text-blue-600 hover:underline">Ver todos</Link>} />
        <ProjectsTable projects={projectRows} />
      </Card>
    </div>
  );
}
