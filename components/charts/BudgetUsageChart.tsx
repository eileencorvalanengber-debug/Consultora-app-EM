"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Row = {
  name: string;
  usedPct: number;
  used: number;
  budget: number;
};

export function BudgetUsageChart({ data }: { data: Row[] }) {
  if (data.length === 0) {
    return <p className="px-5 py-8 text-center text-sm text-slate-500">No hay proyectos activos con presupuesto de horas cargado.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 46)}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
        <XAxis type="number" domain={[0, 120]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12, fill: "#64748b" }} />
        <YAxis type="category" dataKey="name" width={190} tick={{ fontSize: 12, fill: "#334155" }} />
        <Tooltip
          formatter={(_value, _name, item) => {
            const row = item.payload as Row;
            return [`${row.used.toFixed(0)}h de ${row.budget.toFixed(0)}h (${row.usedPct.toFixed(0)}%)`, "Horas"];
          }}
          contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#e2e8f0" }}
        />
        <Bar dataKey="usedPct" radius={[0, 4, 4, 0]} maxBarSize={18}>
          <LabelList dataKey="usedPct" position="right" formatter={(v: unknown) => `${Number(v).toFixed(0)}%`} style={{ fontSize: 11, fill: "#475569" }} />
          {data.map((row, i) => (
            <Cell key={i} fill={row.usedPct >= 100 ? "#dc2626" : row.usedPct >= 85 ? "#d97706" : "#2563eb"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
