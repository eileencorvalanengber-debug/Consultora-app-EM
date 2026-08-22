import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ProjectStatusSelect } from "@/components/ProjectStatusSelect";
import { TaskStatusSelect } from "@/components/TaskStatusSelect";
import { PROJECT_STATUS_COLOR, PROJECT_STATUS_LABEL, TASK_PRIORITY_COLOR, TASK_PRIORITY_LABEL } from "@/lib/labels";
import { formatCurrency, formatDate, formatDateInput, formatHours } from "@/lib/format";
import { addProjectMember, createTask, createTimeEntry, updateProjectBudget, updateProjectProgress } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function ProyectoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      members: { include: { teamMember: true } },
      tasks: { include: { assignee: true }, orderBy: [{ status: "asc" }, { dueDate: "asc" }] },
      timeEntries: { include: { teamMember: true, task: true }, orderBy: { date: "desc" } },
    },
  });

  if (!project) notFound();

  const teamMembers = await prisma.teamMember.findMany({ where: { active: true }, orderBy: { name: "asc" } });

  const hoursUsed = project.timeEntries.reduce((s, e) => s + e.hours, 0);
  const budgetPct = project.budgetHours > 0 ? (hoursUsed / project.budgetHours) * 100 : 0;
  const billableHours = project.timeEntries.filter((e) => e.billable).reduce((s, e) => s + e.hours, 0);
  const estimatedRevenue = billableHours * project.hourlyRate;
  const assignedMemberIds = new Set(project.members.map((m) => m.teamMemberId));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{project.client.name}</p>
          <h1 className="mt-0.5 text-xl font-semibold text-slate-900">{project.name}</h1>
          {project.description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{project.description}</p>}
        </div>
        <ProjectStatusSelect projectId={project.id} status={project.status} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Horas</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">
            {formatHours(hoursUsed)} <span className="text-sm font-normal text-slate-400">/ {formatHours(project.budgetHours)}</span>
          </p>
          <ProgressBar value={budgetPct} className="mt-2" />
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Presupuesto</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{formatCurrency(project.budgetAmount)}</p>
          <p className="mt-1 text-xs text-slate-500">Facturación estimada: {formatCurrency(estimatedRevenue)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Cronograma</p>
          <p className="mt-2 text-sm font-medium text-slate-900">{formatDate(project.startDate)} → {formatDate(project.endDate)}</p>
          <p className="mt-1 text-xs text-slate-500">Estado: <Badge className={PROJECT_STATUS_COLOR[project.status]}>{PROJECT_STATUS_LABEL[project.status]}</Badge></p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Avance</p>
          <form action={updateProjectProgress} className="mt-2 flex items-center gap-2">
            <input type="hidden" name="projectId" value={project.id} />
            <input
              type="number"
              name="progressPercent"
              min={0}
              max={100}
              defaultValue={project.progressPercent}
              className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none"
            />
            <span className="text-sm text-slate-500">%</span>
            <button type="submit" className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200">
              Guardar
            </button>
          </form>
        </Card>
      </div>

      <Card>
        <CardHeader title="Presupuesto y tarifa" subtitle="Horas, monto y tarifa horaria del proyecto" />
        <form action={updateProjectBudget} className="flex flex-wrap items-end gap-3 px-5 py-4">
          <input type="hidden" name="projectId" value={project.id} />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Horas presupuestadas</label>
            <input type="number" name="budgetHours" min={0} step={1} defaultValue={project.budgetHours} className="w-32 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Presupuesto (CLP)</label>
            <input type="number" name="budgetAmount" min={0} step={100000} defaultValue={project.budgetAmount} className="w-40 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Tarifa horaria (CLP)</label>
            <input type="number" name="hourlyRate" min={0} step={1000} defaultValue={project.hourlyRate} className="w-32 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none" />
          </div>
          <button type="submit" className="rounded-lg bg-brand-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark">
            Guardar cambios
          </button>
        </form>
      </Card>

      <Card>
        <CardHeader title="Equipo asignado" subtitle="Consultores y horas semanales asignadas" />
        <div className="divide-y divide-slate-100">
          {project.members.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div>
                <p className="font-medium text-slate-900">{m.teamMember.name}</p>
                <p className="text-xs text-slate-500">{m.roleOnProject}</p>
              </div>
              <p className="text-slate-600">{m.allocationHoursPerWeek} h/semana</p>
            </div>
          ))}
          {project.members.length === 0 && <p className="px-5 py-6 text-center text-sm text-slate-500">Todavía no hay consultores asignados.</p>}
        </div>
        <form action={addProjectMember} className="flex flex-wrap items-end gap-3 border-t border-slate-100 px-5 py-4">
          <input type="hidden" name="projectId" value={project.id} />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Consultor/a</label>
            <select name="teamMemberId" required className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none">
              <option value="">Seleccionar...</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {assignedMemberIds.has(m.id) ? "(ya asignado/a)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Rol en el proyecto</label>
            <input name="roleOnProject" placeholder="Ej: Consultor Senior" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Horas/semana</label>
            <input type="number" name="allocationHoursPerWeek" min={0} step={1} defaultValue={10} className="w-24 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none" />
          </div>
          <button type="submit" className="rounded-lg bg-brand-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark">
            Asignar
          </button>
        </form>
      </Card>

      <Card>
        <CardHeader title="Tareas" subtitle={`${project.tasks.filter((t) => t.status === "COMPLETADA").length} de ${project.tasks.length} completadas`} />
        <div className="divide-y divide-slate-100">
          {project.tasks.map((task) => (
            <div key={task.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{task.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <Badge className={TASK_PRIORITY_COLOR[task.priority]}>{TASK_PRIORITY_LABEL[task.priority]}</Badge>
                  {task.assignee && <span>{task.assignee.name}</span>}
                  {task.dueDate && <span>Vence: {formatDate(task.dueDate)}</span>}
                </div>
              </div>
              <TaskStatusSelect taskId={task.id} projectId={project.id} status={task.status} />
            </div>
          ))}
          {project.tasks.length === 0 && <p className="px-5 py-6 text-center text-sm text-slate-500">Todavía no hay tareas cargadas.</p>}
        </div>
        <form action={createTask} className="flex flex-wrap items-end gap-3 border-t border-slate-100 px-5 py-4">
          <input type="hidden" name="projectId" value={project.id} />
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">Título</label>
            <input name="title" required className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Prioridad</label>
            <select name="priority" defaultValue="MEDIA" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none">
              <option value="BAJA">Baja</option>
              <option value="MEDIA">Media</option>
              <option value="ALTA">Alta</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Responsable</label>
            <select name="assigneeId" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none">
              <option value="">Sin asignar</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Vencimiento</label>
            <input type="date" name="dueDate" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none" />
          </div>
          <button type="submit" className="rounded-lg bg-brand-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark">
            Agregar tarea
          </button>
        </form>
      </Card>

      <Card>
        <CardHeader title="Horas cargadas" subtitle="Últimos registros de horas del equipo" />
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
          {project.timeEntries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between px-5 py-2.5 text-sm">
              <div>
                <p className="font-medium text-slate-900">{entry.teamMember.name}</p>
                <p className="text-xs text-slate-500">
                  {formatDate(entry.date)} {entry.task ? `· ${entry.task.title}` : ""} {!entry.billable ? "· No facturable" : ""}
                </p>
              </div>
              <p className="font-medium text-slate-700">{formatHours(entry.hours)}</p>
            </div>
          ))}
          {project.timeEntries.length === 0 && <p className="px-5 py-6 text-center text-sm text-slate-500">Todavía no hay horas cargadas.</p>}
        </div>
        <form action={createTimeEntry} className="flex flex-wrap items-end gap-3 border-t border-slate-100 px-5 py-4">
          <input type="hidden" name="projectId" value={project.id} />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Consultor/a</label>
            <select name="teamMemberId" required className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none">
              <option value="">Seleccionar...</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Tarea (opcional)</label>
            <select name="taskId" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none">
              <option value="">Sin tarea asociada</option>
              {project.tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Fecha</label>
            <input type="date" name="date" defaultValue={formatDateInput(new Date())} required className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Horas</label>
            <input type="number" name="hours" min={0.5} step={0.5} defaultValue={1} required className="w-20 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none" />
          </div>
          <label className="flex items-center gap-1.5 pb-2 text-sm text-slate-600">
            <input type="checkbox" name="billable" defaultChecked /> Facturable
          </label>
          <button type="submit" className="rounded-lg bg-brand-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark">
            Cargar horas
          </button>
        </form>
      </Card>
    </div>
  );
}
