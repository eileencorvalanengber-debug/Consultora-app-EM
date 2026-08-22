import Link from "next/link";
import type { Alert } from "@/lib/alerts";

const SEVERITY_STYLE: Record<Alert["severity"], { dot: string; badge: string; label: string }> = {
  critica: { dot: "bg-red-500", badge: "bg-red-50 text-red-700 ring-red-600/20", label: "Crítica" },
  advertencia: { dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700 ring-amber-600/20", label: "Advertencia" },
  info: { dot: "bg-slate-400", badge: "bg-slate-100 text-slate-700 ring-slate-600/20", label: "Info" },
};

export function AlertsList({ alerts, limit }: { alerts: Alert[]; limit?: number }) {
  const items = limit ? alerts.slice(0, limit) : alerts;

  if (items.length === 0) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-sm font-medium text-slate-700">Sin alertas activas</p>
        <p className="mt-1 text-xs text-slate-500">Todos los proyectos están dentro de los parámetros esperados.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {items.map((alert) => {
        const style = SEVERITY_STYLE[alert.severity];
        return (
          <li key={alert.id}>
            <Link href={alert.href} className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-slate-50">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-slate-900">{alert.title}</p>
                  <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${style.badge}`}>
                    {alert.category}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">{alert.description}</p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
