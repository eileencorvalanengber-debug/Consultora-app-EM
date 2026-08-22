import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { ProjectsTable, type ProjectRow } from "@/components/ProjectsTable";

export const dynamic = "force-dynamic";

export default async function ProyectosPage() {
  const projects = await prisma.project.findMany({
    include: { client: true, timeEntries: true },
    orderBy: [{ status: "asc" }, { endDate: "asc" }],
  });

  const rows: ProjectRow[] = projects.map((p) => ({
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Proyectos</h1>
          <p className="mt-1 text-sm text-slate-500">{projects.length} proyecto(s) en total</p>
        </div>
        <Link
          href="/proyectos/nuevo"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Nuevo proyecto
        </Link>
      </div>

      <Card>
        <ProjectsTable projects={rows} />
      </Card>
    </div>
  );
}
