// Cálculos de presupuesto por ítems. Funciones puras: sin base de datos.

export type ItemLite = { id: string; hours: number; hourlyRate: number };
export type EntryLite = { hours: number; billable: boolean; budgetItemId: string | null };

export function totalsFromItems(items: { hours: number; hourlyRate: number }[]) {
  const hours = items.reduce((s, i) => s + i.hours, 0);
  const value = items.reduce((s, i) => s + i.hours * i.hourlyRate, 0);
  // Tarifa promedio ponderada por horas (0 si no hay horas presupuestadas).
  const avgRate = hours > 0 ? value / hours : 0;
  return { hours, value, avgRate };
}

// Costo de honorarios de las horas cargadas: cada hora se valoriza con el pago por hora de su ítem.
// Las horas sin ítem usan el pago promedio ponderado del proyecto. (La tarifa es lo que se PAGA al
// consultor, no lo que se cobra al cliente: el ingreso es el presupuesto neto del proyecto.)
export function laborCost(entries: EntryLite[], items: ItemLite[], fallbackRate: number): number {
  const rateById = new Map(items.map((i) => [i.id, i.hourlyRate]));
  return entries.reduce(
    (sum, e) => sum + e.hours * (e.budgetItemId ? (rateById.get(e.budgetItemId) ?? fallbackRate) : fallbackRate),
    0
  );
}

// Margen de contribución = presupuesto neto − costo de honorarios. Es lo que el proyecto aporta
// a los gastos fijos (no es utilidad: aún no se descuentan los gastos fijos).
export function contribution(budgetAmount: number, cost: number) {
  const margin = budgetAmount - cost;
  return { margin, pct: budgetAmount > 0 ? (margin / budgetAmount) * 100 : 0 };
}

export function hoursByItem(entries: EntryLite[]): Map<string | null, number> {
  const m = new Map<string | null, number>();
  for (const e of entries) m.set(e.budgetItemId, (m.get(e.budgetItemId) ?? 0) + e.hours);
  return m;
}
