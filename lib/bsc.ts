import type { Perspective, Sentido } from "@prisma/client";

export type Estado = "VERDE" | "AMARILLO" | "ROJO" | "SIN_DATO";

export const PERSPECTIVE_LABEL: Record<Perspective, string> = {
  FINANCIERA: "Financiera",
  CLIENTES: "Clientes",
  PROCESOS_INTERNOS: "Procesos Internos",
  APRENDIZAJE_CRECIMIENTO: "Aprendizaje y Crecimiento",
};

export const PERSPECTIVE_COLOR: Record<Perspective, string> = {
  FINANCIERA: "#0000cc",
  CLIENTES: "#00005b",
  PROCESOS_INTERNOS: "#059669",
  APRENDIZAJE_CRECIMIENTO: "#d97706",
};

export const ESTADO_LABEL: Record<Estado, string> = {
  VERDE: "En meta",
  AMARILLO: "En riesgo",
  ROJO: "Bajo meta",
  SIN_DATO: "Sin dato",
};

export const ESTADO_COLOR: Record<Estado, string> = {
  VERDE: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  AMARILLO: "bg-amber-50 text-amber-700 ring-amber-600/20",
  ROJO: "bg-red-50 text-red-700 ring-red-600/20",
  SIN_DATO: "bg-slate-100 text-slate-600 ring-slate-600/20",
};

export const ESTADO_DOT: Record<Estado, string> = {
  VERDE: "bg-emerald-500",
  AMARILLO: "bg-amber-500",
  ROJO: "bg-red-500",
  SIN_DATO: "bg-slate-300",
};

export const MONTH_LABELS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

export function computeCompliance(result: number | null | undefined, target: number, sentido: Sentido): number | null {
  if (result === null || result === undefined) return null;
  if (sentido === "MAYOR") {
    if (target <= 0) return null;
    return (result / target) * 100;
  }
  if (result <= 0) return 100;
  return (target / result) * 100;
}

export function computeEstado(compliance: number | null): Estado {
  if (compliance === null) return "SIN_DATO";
  if (compliance >= 90) return "VERDE";
  if (compliance >= 70) return "AMARILLO";
  return "ROJO";
}
