import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader } from "@/components/ui/Card";
import { updateTeamMember } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function EditarConsultorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const member = await prisma.teamMember.findUnique({ where: { id } });
  if (!member) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Editar consultor/a</h1>
        <p className="mt-1 text-sm text-slate-500">Actualiza los datos de {member.name}.</p>
      </div>

      <Card>
        <CardHeader title="Datos del consultor/a" />
        <form action={updateTeamMember} className="space-y-4 px-5 py-5">
          <input type="hidden" name="teamMemberId" value={member.id} />

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
            <input name="name" required defaultValue={member.name} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Rol</label>
            <input name="role" placeholder="Ej: Consultor Senior" defaultValue={member.role} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input type="email" name="email" defaultValue={member.email ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Capacidad semanal (horas)</label>
            <input type="number" name="weeklyCapacityHours" min={0} step={1} defaultValue={member.weeklyCapacityHours} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none" />
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
