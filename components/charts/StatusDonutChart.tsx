"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type Row = { name: string; value: number; color: string };

export function StatusDonutChart({ data }: { data: Row[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return <p className="px-5 py-8 text-center text-sm text-slate-500">Todavía no hay proyectos cargados.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
          {data.map((row, i) => (
            <Cell key={i} fill={row.color} stroke="white" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip formatter={(value: unknown, name: unknown) => [`${value} proyecto(s)`, String(name)]} contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#e2e8f0" }} />
        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
