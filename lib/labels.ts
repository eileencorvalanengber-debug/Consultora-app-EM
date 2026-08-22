import type { ProjectStatus, TaskStatus, TaskPriority } from "@prisma/client";

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  PLANIFICACION: "Planificación",
  EN_CURSO: "En curso",
  EN_RIESGO: "En riesgo",
  PAUSADO: "Pausado",
  COMPLETADO: "Completado",
};

export const PROJECT_STATUS_COLOR: Record<ProjectStatus, string> = {
  PLANIFICACION: "bg-slate-100 text-slate-700 ring-slate-600/20",
  EN_CURSO: "bg-blue-50 text-blue-700 ring-blue-600/20",
  EN_RIESGO: "bg-red-50 text-red-700 ring-red-600/20",
  PAUSADO: "bg-amber-50 text-amber-700 ring-amber-600/20",
  COMPLETADO: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  PENDIENTE: "Pendiente",
  EN_CURSO: "En curso",
  COMPLETADA: "Completada",
  BLOQUEADA: "Bloqueada",
};

export const TASK_STATUS_COLOR: Record<TaskStatus, string> = {
  PENDIENTE: "bg-slate-100 text-slate-700 ring-slate-600/20",
  EN_CURSO: "bg-blue-50 text-blue-700 ring-blue-600/20",
  COMPLETADA: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  BLOQUEADA: "bg-red-50 text-red-700 ring-red-600/20",
};

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
};

export const TASK_PRIORITY_COLOR: Record<TaskPriority, string> = {
  BAJA: "bg-slate-100 text-slate-600 ring-slate-600/20",
  MEDIA: "bg-amber-50 text-amber-700 ring-amber-600/20",
  ALTA: "bg-red-50 text-red-700 ring-red-600/20",
};
