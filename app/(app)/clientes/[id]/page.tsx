import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader } from "@/components/ui/Card";
import { updateClient } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Editar cliente</h1>
        <p className="mt-1 text-sm text-slate-500">Actualiza los datos de {client.name}.</p>
      </div>

      <Card>
        <CardHeader title="Datos del cliente" />
        <form action={updateClient} className="space-y-4 px-5 py-5">
          <input type="hidden" name="clientId" value={client.id} />

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
            <input name="name" required defaultValue={client.name} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Industria</label>
            <input name="industry" defaultValue={client.industry ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Contacto</label>
            <input name="contactName" placeholder="Nombre del contacto" defaultValue={client.contactName ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email de contacto</label>
            <input type="email" name="contactEmail" defaultValue={client.contactEmail ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Teléfono</label>
            <input name="contactPhone" defaultValue={client.contactPhone ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="submit" className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
              Guardar cambios
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
