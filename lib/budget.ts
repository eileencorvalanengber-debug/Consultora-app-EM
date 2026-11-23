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

// Facturación estimada: cada hora facturable se valoriza con la tarifa de su ítem.
// Las horas sin ítem usan la tarifa promedio del proyecto.
export function estimatedRevenue(entries: EntryLite[], items: ItemLite[], fallbackRate: number): number {
  const rateById = new Map(items.map((i) => [i.id, i.hourlyRate]));
  return entries
    .filter((e) => e.billable)
    .reduce((sum, e) => sum + e.hours * (e.budgetItemId ? (rateById.get(e.budgetItemId) ?? fallbackRate) : fallbackRate), 0);
}

export function hoursByItem(entries: EntryLite[]): Map<string | null, number> {
  const m = new Map<string | null, number>();
  for (const e of entries) m.set(e.budgetItemId, (m.get(e.budgetItemId) ?? 0) + e.hours);
  return m;
}
