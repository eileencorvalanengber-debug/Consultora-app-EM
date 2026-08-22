import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { PROJECT_STATUS_COLOR, PROJECT_STATUS_LABEL } from "@/lib/labels";
import { formatDate, formatHours } from "@/lib/format";
import type { ProjectStatus } from "@prisma/client";

export type ProjectRow = {
  id: string;
  name: string;
  clientName: string;
  status: ProjectStatus;
  endDate: Date;
  progressPercent: number;
  hoursUsed: number;
  budgetHours: number;
};

export function ProjectsTable({ projects }: { projects: ProjectRow[] }) {
  if (projects.length === 0) {
    return <p className="px-5 py-10 text-center text-sm text-slate-500">No hay proyectos para mostrar.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
            <th className="px-5 py-3 font-medium">Proyecto</th>
            <th className="px-5 py-3 font-medium">Cliente</th>
            <th className="px-5 py-3 font-medium">Estado</th>
            <th className="px-5 py-3 font-medium">Avance</th>
            <th className="px-5 py-3 font-medium">Horas</th>
            <th className="px-5 py-3 font-medium">Fin estimado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {projects.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50">
              <td className="px-5 py-3">
                <Link href={`/proyectos/${p.id}`} className="font-medium text-slate-900 hover:underline">
                  {p.name}
                </Link>
              </td>
              <td className="px-5 py-3 text-slate-600">{p.clientName}</td>
              <td className="px-5 py-3">
                <Badge className={PROJECT_STATUS_COLOR[p.status]}>{PROJECT_STATUS_LABEL[p.status]}</Badge>
              </td>
              <td className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <ProgressBar value={p.progressPercent} className="w-24" />
                  <span className="text-xs text-slate-500">{p.progressPercent}%</span>
                </div>
              </td>
              <td className="px-5 py-3 text-slate-600">
                {p.budgetHours > 0 ? `${formatHours(p.hoursUsed)} / ${formatHours(p.budgetHours)}` : formatHours(p.hoursUsed)}
              </td>
              <td className="px-5 py-3 text-slate-600">{formatDate(p.endDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
