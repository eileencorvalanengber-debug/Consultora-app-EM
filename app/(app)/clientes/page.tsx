import { prisma } from "@/lib/prisma";
import { Card, CardHeader } from "@/components/ui/Card";
import { createClient } from "@/lib/actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const clients = await prisma.client.findMany({
    include: { projects: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Clientes</h1>
        <p className="mt-1 text-sm text-slate-500">{clients.length} cliente(s) en total</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="divide-y divide-slate-100">
            {clients.map((c) => {
              const activeCount = c.projects.filter((p) => p.status !== "COMPLETADO").length;
              return (
                <div key={c.id} className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Link href={`/clientes/${c.id}`} className="text-sm font-semibold text-slate-900 hover:text-brand-primary hover:underline">
                        {c.name}
                      </Link>
                      {c.industry && <p className="text-xs text-slate-500">{c.industry}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">{activeCount} proyecto(s) activo(s)</span>
                      <Link href={`/clientes/${c.id}`} className="text-xs font-medium text-brand-primary hover:underline">
                        Editar
                      </Link>
                    </div>
                  </div>
                  {(c.contactName || c.contactEmail || c.contactPhone) && (
                    <p className="mt-1.5 text-xs text-slate-500">
                      {c.contactName}
                      {c.contactEmail ? ` · ${c.contactEmail}` : ""}
                      {c.contactPhone ? ` · ${c.contactPhone}` : ""}
                    </p>
                  )}
                </div>
              );
            })}
            {clients.length === 0 && <p className="px-5 py-10 text-center text-sm text-slate-500">Todavía no hay clientes cargados.</p>}
          </div>
        </Card>

        <Card>
          <CardHeader title="Nuevo cliente" />
          <form action={createClient} className="space-y-3 px-5 py-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Nombre</label>
              <input name="name" required className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Industria</label>
              <input name="industry" className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Contacto</label>
              <input name="contactName" placeholder="Nombre del contacto" className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Email de contacto</label>
              <input type="email" name="contactEmail" className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Teléfono</label>
              <input name="contactPhone" className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none" />
            </div>
            <button type="submit" className="w-full rounded-lg bg-brand-primary px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark">
              Crear cliente
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
