import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ProjectStatusSelect } from "@/components/ProjectStatusSelect";
import { TaskStatusSelect } from "@/components/TaskStatusSelect";
import { PROJECT_STATUS_COLOR, PROJECT_STATUS_LABEL, TASK_PRIORITY_COLOR, TASK_PRIORITY_LABEL } from "@/lib/labels";
import { formatCurrency, formatDate, formatDateInput, formatHours } from "@/lib/format";
import { requireAuth } from "@/lib/dal";
import { estimatedRevenue as calcRevenue, hoursByItem, totalsFromItems } from "@/lib/budget";
import { addBudgetItem, addProjectMember, createTask, createTimeEntry, deleteBudgetItem, updateBudgetItem, updateProjectBudget, updateProjectMember, updateProjectProgress, updateTask, updateTimeEntry } from "@/lib/actions";

const INPUT = "rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none";
const LABEL = "mb-1 block text-xs font-medium text-slate-600";
const SAVE_BTN = "rounded-lg bg-brand-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark";
const EDIT_SUMMARY = "cursor-pointer select-none text-xs font-medium text-brand-primary hover:underline";

export const dynamic = "force-dynamic";

export default async function ProyectoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      members: { include: { teamMember: true } },
      tasks: { include: { assignee: true }, orderBy: [{ status: "asc" }, { dueDate: "asc" }] },
      timeEntries: { include: { teamMember: true, task: true, budgetItem: true }, orderBy: { date: "desc" } },
      budgetItems: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
    },
  });

  if (!project) notFound();

  const teamMembers = await prisma.teamMember.findMany({ where: { active: true }, orderBy: { name: "asc" } });

  const hoursUsed = project.timeEntries.reduce((s, e) => s + e.hours, 0);
  const budgetPct = project.budgetHours > 0 ? (hoursUsed / project.budgetHours) * 100 : 0;
  const itemTotals = totalsFromItems(project.budgetItems);
  const usedByItem = hoursByItem(project.timeEntries);
  const hoursWithoutItem = usedByItem.get(null) ?? 0;
  const estimatedRevenue = calcRevenue(project.timeEntries, project.budgetItems, itemTotals.avgRate);
  const budgetGap = project.budgetAmount - itemTotals.value; // presupuesto del proyecto vs valor de las horas
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
        <CardHeader title="Presupuesto del proyecto" subtitle="Monto total acordado con el cliente (CLP)" />
        <form action={updateProjectBudget} className="flex flex-wrap items-end gap-3 px-5 py-4">
          <input type="hidden" name="projectId" value={project.id} />
          <div>
            <label className={LABEL}>Presupuesto (CLP)</label>
            <input type="number" name="budgetAmount" min={0} step={1} defaultValue={project.budgetAmount} className={`w-44 ${INPUT}`} />
          </div>
          <button type="submit" className={SAVE_BTN}>Guardar cambios</button>
        </form>
        {project.budgetItems.length > 0 && project.budgetAmount > 0 && (
          <p className={`border-t border-slate-100 px-5 py-3 text-xs ${budgetGap < 0 ? "text-red-600" : "text-slate-500"}`}>
            Valor de las horas por ítem: {formatCurrency(itemTotals.value)} ·{" "}
            {budgetGap >= 0
              ? `queda un margen de ${formatCurrency(budgetGap)} sobre el presupuesto`
              : `las horas valorizadas superan el presupuesto por ${formatCurrency(-budgetGap)}`}
          </p>
        )}
      </Card>

      <Card>
        <CardHeader title="Horas presupuestadas por ítem" subtitle="Cada ítem tiene su propia tarifa horaria (diseño, gestión, mejoras…)" />
        <div className="divide-y divide-slate-100">
          {project.budgetItems.map((item) => {
            const used = usedByItem.get(item.id) ?? 0;
            const pct = item.hours > 0 ? (used / item.hours) * 100 : used > 0 ? 100 : 0;
            const over = item.hours > 0 ? used > item.hours : used > 0;
            return (
              <div key={item.id} className="px-5 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-slate-900">{item.name}</p>
                  <p className="text-slate-600">
                    <span className={over ? "font-semibold text-red-600" : ""}>{formatHours(used)}</span> / {formatHours(item.hours)}
                    <span className="mx-2 text-slate-300">·</span>
                    {formatCurrency(item.hourlyRate)}/h
                    <span className="mx-2 text-slate-300">·</span>
                    {formatCurrency(item.hours * item.hourlyRate)}
                  </p>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${over ? "bg-red-500" : "bg-blue-500"}`} style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
                <details className="mt-2">
                  <summary className={EDIT_SUMMARY}>Editar</summary>
                  <form action={updateBudgetItem} className="mt-2 flex flex-wrap items-end gap-3">
                    <input type="hidden" name="itemId" value={item.id} />
                    <input type="hidden" name="projectId" value={project.id} />
                    <div>
                      <label className={LABEL}>Ítem</label>
                      <input name="name" required defaultValue={item.name} className={INPUT} />
                    </div>
                    <div>
                      <label className={LABEL}>Horas</label>
                      <input type="number" name="hours" min={0} step="any" defaultValue={item.hours} className={`w-24 ${INPUT}`} />
                    </div>
                    <div>
                      <label className={LABEL}>Tarifa horaria (CLP)</label>
                      <input type="number" name="hourlyRate" min={0} step={1} defaultValue={item.hourlyRate} className={`w-36 ${INPUT}`} />
                    </div>
                    <button type="submit" className={SAVE_BTN}>Guardar</button>
                  </form>
                  <form action={deleteBudgetItem} className="mt-2">
                    <input type="hidden" name="itemId" value={item.id} />
                    <input type="hidden" name="projectId" value={project.id} />
                    <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                      Eliminar ítem (las horas ya cargadas se conservan, quedan sin ítem)
                    </button>
                  </form>
                </details>
              </div>
            );
          })}
          {project.budgetItems.length === 0 && (
            <p className="px-5 py-6 text-center text-sm text-slate-500">Todavía no hay ítems. Agrega el primero abajo (por ejemplo, “Diseño”).</p>
          )}
          {project.budgetItems.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-800">
              <span>Total</span>
              <span>
                {formatHours(hoursUsed)} / {formatHours(itemTotals.hours)}
                <span className="mx-2 text-slate-300">·</span>
                {formatCurrency(itemTotals.value)}
              </span>
            </div>
          )}
          {hoursWithoutItem > 0 && project.budgetItems.length > 0 && (
            <p className="px-5 py-2.5 text-xs text-amber-700">
              {formatHours(hoursWithoutItem)} cargadas sin ítem: se valorizan a la tarifa promedio ({formatCurrency(itemTotals.avgRate)}/h). Asígnales un ítem editando la hora cargada.
            </p>
          )}
        </div>
        <form action={addBudgetItem} className="flex flex-wrap items-end gap-3 border-t border-slate-100 px-5 py-4">
          <input type="hidden" name="projectId" value={project.id} />
          <div>
            <label className={LABEL}>Ítem</label>
            <input name="name" required placeholder="Ej: Diseño, Gestión, Mejoras" className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Horas</label>
            <input type="number" name="hours" min={0} step="any" defaultValue={0} className={`w-24 ${INPUT}`} />
          </div>
          <div>
            <label className={LABEL}>Tarifa horaria (CLP)</label>
            <input type="number" name="hourlyRate" min={0} step={1} defaultValue={0} className={`w-36 ${INPUT}`} />
          </div>
          <button type="submit" className={SAVE_BTN}>Agregar ítem</button>
        </form>
      </Card>

      <Card>
        <CardHeader title="Equipo asignado" subtitle="Consultores y horas semanales asignadas" />
        <div className="divide-y divide-slate-100">
          {project.members.map((m) => (
            <div key={m.id} className="px-5 py-3 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{m.teamMember.name}</p>
                  <p className="text-xs text-slate-500">{m.roleOnProject}</p>
                </div>
                <p className="text-slate-600">{m.allocationHoursPerWeek} h/semana</p>
              </div>
              <details className="mt-2">
                <summary className={EDIT_SUMMARY}>Editar</summary>
                <form action={updateProjectMember} className="mt-2 flex flex-wrap items-end gap-3">
                  <input type="hidden" name="memberId" value={m.id} />
                  <input type="hidden" name="projectId" value={project.id} />
                  <div>
                    <label className={LABEL}>Rol en el proyecto</label>
                    <input name="roleOnProject" defaultValue={m.roleOnProject} className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>Horas/semana</label>
                    <input type="number" name="allocationHoursPerWeek" min={0} step="any" defaultValue={m.allocationHoursPerWeek} className={`w-24 ${INPUT}`} />
                  </div>
                  <button type="submit" className={SAVE_BTN}>Guardar</button>
                </form>
              </details>
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
            <input type="number" name="allocationHoursPerWeek" min={0} step="any" defaultValue={10} className="w-24 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none" />
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
            <div key={task.id} className="px-5 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
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
              <details className="mt-2">
                <summary className={EDIT_SUMMARY}>Editar</summary>
                <form action={updateTask} className="mt-2 flex flex-wrap items-end gap-3">
                  <input type="hidden" name="taskId" value={task.id} />
                  <input type="hidden" name="projectId" value={project.id} />
                  <div className="min-w-[200px] flex-1">
                    <label className={LABEL}>Título</label>
                    <input name="title" required defaultValue={task.title} className={`w-full ${INPUT}`} />
                  </div>
                  <div>
                    <label className={LABEL}>Prioridad</label>
                    <select name="priority" defaultValue={task.priority} className={INPUT}>
                      <option value="BAJA">Baja</option>
                      <option value="MEDIA">Media</option>
                      <option value="ALTA">Alta</option>
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Responsable</label>
                    <select name="assigneeId" defaultValue={task.assigneeId ?? ""} className={INPUT}>
                      <option value="">Sin asignar</option>
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Vencimiento</label>
                    <input type="date" name="dueDate" defaultValue={task.dueDate ? formatDateInput(task.dueDate) : ""} className={INPUT} />
                  </div>
                  <button type="submit" className={SAVE_BTN}>Guardar</button>
                </form>
              </details>
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
            <div key={entry.id} className="px-5 py-2.5 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{entry.teamMember.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(entry.date)} {entry.budgetItem ? `· ${entry.budgetItem.name}` : ""} {entry.task ? `· ${entry.task.title}` : ""} {!entry.billable ? "· No facturable" : ""}
                  </p>
                </div>
                <p className="font-medium text-slate-700">{formatHours(entry.hours)}</p>
              </div>
              <details className="mt-1.5">
                <summary className={EDIT_SUMMARY}>Editar</summary>
                <form action={updateTimeEntry} className="mt-2 flex flex-wrap items-end gap-3">
                  <input type="hidden" name="entryId" value={entry.id} />
                  <input type="hidden" name="projectId" value={project.id} />
                  <div>
                    <label className={LABEL}>Consultor/a</label>
                    <select name="teamMemberId" required defaultValue={entry.teamMemberId} className={INPUT}>
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                      {!teamMembers.some((m) => m.id === entry.teamMemberId) && (
                        <option value={entry.teamMemberId}>{entry.teamMember.name}</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Ítem de presupuesto</label>
                    <select name="budgetItemId" defaultValue={entry.budgetItemId ?? ""} className={INPUT}>
                      <option value="">Sin ítem</option>
                      {project.budgetItems.map((i) => (
                        <option key={i.id} value={i.id}>{i.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Tarea</label>
                    <select name="taskId" defaultValue={entry.taskId ?? ""} className={INPUT}>
                      <option value="">Sin tarea asociada</option>
                      {project.tasks.map((t) => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Fecha</label>
                    <input type="date" name="date" required defaultValue={formatDateInput(entry.date)} className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>Horas</label>
                    <input type="number" name="hours" min={0.25} step="any" required defaultValue={entry.hours} className={`w-20 ${INPUT}`} />
                  </div>
                  <label className="flex items-center gap-1.5 pb-2 text-sm text-slate-600">
                    <input type="checkbox" name="billable" defaultChecked={entry.billable} /> Facturable
                  </label>
                  <button type="submit" className={SAVE_BTN}>Guardar</button>
                </form>
              </details>
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
            <label className="mb-1 block text-xs font-medium text-slate-600">Ítem de presupuesto</label>
            <select name="budgetItemId" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none">
              <option value="">Sin ítem</option>
              {project.budgetItems.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
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
            <input type="number" name="hours" min={0.25} step="any" defaultValue={1} required className="w-20 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none" />
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
