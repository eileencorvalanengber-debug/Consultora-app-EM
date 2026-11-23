"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ProjectStatus, Sentido, TaskPriority, TaskStatus } from "@prisma/client";
import { requireAuth } from "@/lib/dal";
import { totalsFromItems } from "@/lib/budget";

const PROJECT_STATUSES = ["PLANIFICACION", "EN_CURSO", "EN_RIESGO", "PAUSADO", "COMPLETADO"] as const;
const TASK_STATUSES = ["PENDIENTE", "EN_CURSO", "COMPLETADA", "BLOQUEADA"] as const;
const TASK_PRIORITIES = ["BAJA", "MEDIA", "ALTA"] as const;
const SENTIDOS = ["MAYOR", "MENOR"] as const;

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}
function num(fd: FormData, key: string): number {
  const v = Number(fd.get(key));
  return Number.isFinite(v) ? v : 0;
}
// Número no negativo (horas, montos, tarifas).
function nonNeg(fd: FormData, key: string): number {
  return Math.max(0, num(fd, key));
}
// Solo acepta valores de la lista permitida; si no, usa el valor por defecto o falla.
function oneOf<T extends string>(value: string, allowed: readonly T[], fallback?: T): T {
  if ((allowed as readonly string[]).includes(value)) return value as T;
  if (fallback !== undefined) return fallback;
  throw new Error("Valor no válido");
}
function dateOf(value: string): Date {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error("Fecha no válida");
  return d;
}

// Mantiene Project.budgetHours / hourlyRate como totales derivados de los ítems.
async function syncBudgetTotals(projectId: string) {
  const items = await prisma.budgetItem.findMany({ where: { projectId } });
  const { hours, avgRate } = totalsFromItems(items);
  await prisma.project.update({ where: { id: projectId }, data: { budgetHours: hours, hourlyRate: avgRate } });
}

// El ítem debe pertenecer al mismo proyecto; si no, se ignora.
async function validItemId(projectId: string, raw: string): Promise<string | null> {
  if (!raw) return null;
  const item = await prisma.budgetItem.findFirst({ where: { id: raw, projectId }, select: { id: true } });
  return item?.id ?? null;
}

// Ventana anti doble clic: si ya se creó un registro idéntico hace unos segundos, no se repite.
const DUPLICATE_WINDOW_MS = 15_000;
function justNow(): Date {
  return new Date(Date.now() - DUPLICATE_WINDOW_MS);
}

function revalidateProject(projectId: string) {
  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/proyectos");
  revalidatePath("/");
}

export async function upsertKpiMeasurement(formData: FormData) {
  await requireAuth();
  const objectiveId = str(formData, "objectiveId");
  const year = Math.trunc(num(formData, "year"));
  const month = Math.trunc(num(formData, "month"));
  if (!objectiveId || !year || !month) throw new Error("Faltan datos");

  const resultRaw = str(formData, "resultValue");
  const comment = str(formData, "comment");

  await prisma.kpiMeasurement.upsert({
    where: { objectiveId_year_month: { objectiveId, year, month } },
    update: {
      resultValue: resultRaw === "" ? null : Number(resultRaw),
      comment: comment || null,
    },
    create: {
      objectiveId,
      year,
      month,
      resultValue: resultRaw === "" ? null : Number(resultRaw),
      comment: comment || null,
    },
  });

  revalidatePath("/indicadores");
  revalidatePath("/indicadores/seguimiento");
}

export async function updateStrategicObjective(formData: FormData) {
  await requireAuth();
  const objectiveId = str(formData, "objectiveId");
  const objective = str(formData, "objective");
  const kpiName = str(formData, "kpiName");
  if (!objectiveId || !objective || !kpiName) throw new Error("Faltan datos");

  await prisma.strategicObjective.update({
    where: { id: objectiveId },
    data: {
      objective,
      kpiName,
      unit: str(formData, "unit") || "%",
      targetValue: num(formData, "targetValue"),
      sentido: oneOf<Sentido>(str(formData, "sentido"), SENTIDOS),
      frequency: str(formData, "frequency") || "Mensual",
      responsible: str(formData, "responsible") || "Sin asignar",
      justification: str(formData, "justification") || null,
      priorityInitiative: str(formData, "priorityInitiative") || null,
    },
  });

  revalidatePath("/indicadores");
  revalidatePath("/indicadores/seguimiento");
  redirect("/indicadores");
}

export async function createClient(formData: FormData) {
  await requireAuth();
  const name = str(formData, "name");
  if (!name) throw new Error("El nombre del cliente es obligatorio");

  await prisma.client.create({
    data: {
      name,
      industry: str(formData, "industry") || null,
      contactName: str(formData, "contactName") || null,
      contactEmail: str(formData, "contactEmail") || null,
      contactPhone: str(formData, "contactPhone") || null,
    },
  });

  revalidatePath("/clientes");
}

export async function updateClient(formData: FormData) {
  await requireAuth();
  const clientId = str(formData, "clientId");
  const name = str(formData, "name");
  if (!clientId || !name) throw new Error("El nombre del cliente es obligatorio");

  await prisma.client.update({
    where: { id: clientId },
    data: {
      name,
      industry: str(formData, "industry") || null,
      contactName: str(formData, "contactName") || null,
      contactEmail: str(formData, "contactEmail") || null,
      contactPhone: str(formData, "contactPhone") || null,
    },
  });

  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function createTeamMember(formData: FormData) {
  await requireAuth();
  const name = str(formData, "name");
  if (!name) throw new Error("El nombre es obligatorio");

  await prisma.teamMember.create({
    data: {
      name,
      email: str(formData, "email") || null,
      role: str(formData, "role") || "Consultor/a",
      weeklyCapacityHours: nonNeg(formData, "weeklyCapacityHours") || 40,
    },
  });

  revalidatePath("/equipo");
}

export async function updateTeamMember(formData: FormData) {
  await requireAuth();
  const teamMemberId = str(formData, "teamMemberId");
  const name = str(formData, "name");
  if (!teamMemberId || !name) throw new Error("El nombre es obligatorio");

  await prisma.teamMember.update({
    where: { id: teamMemberId },
    data: {
      name,
      email: str(formData, "email") || null,
      role: str(formData, "role") || "Consultor/a",
      weeklyCapacityHours: nonNeg(formData, "weeklyCapacityHours") || 40,
    },
  });

  revalidatePath("/equipo");
  redirect("/equipo");
}

export async function createProject(formData: FormData) {
  await requireAuth();
  const name = str(formData, "name");
  const clientId = str(formData, "clientId");
  if (!name || !clientId) throw new Error("Nombre y cliente son obligatorios");

  const project = await prisma.project.create({
    data: {
      name,
      clientId,
      description: str(formData, "description") || null,
      status: oneOf<ProjectStatus>(str(formData, "status"), PROJECT_STATUSES, "PLANIFICACION"),
      startDate: dateOf(str(formData, "startDate")),
      endDate: dateOf(str(formData, "endDate")),
      budgetAmount: nonNeg(formData, "budgetAmount"),
      progressPercent: 0,
    },
  });

  revalidatePath("/proyectos");
  redirect(`/proyectos/${project.id}`);
}

export async function updateProjectStatus(formData: FormData) {
  await requireAuth();
  const projectId = str(formData, "projectId");
  const status = oneOf<ProjectStatus>(str(formData, "status"), PROJECT_STATUSES);
  await prisma.project.update({ where: { id: projectId }, data: { status } });
  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/proyectos");
  revalidatePath("/");
}

export async function updateProjectBudget(formData: FormData) {
  await requireAuth();
  const projectId = str(formData, "projectId");
  await prisma.project.update({
    where: { id: projectId },
    data: { budgetAmount: nonNeg(formData, "budgetAmount") },
  });
  revalidateProject(projectId);
}

export async function updateProjectProgress(formData: FormData) {
  await requireAuth();
  const projectId = str(formData, "projectId");
  const progressPercent = Math.max(0, Math.min(100, num(formData, "progressPercent")));
  await prisma.project.update({ where: { id: projectId }, data: { progressPercent } });
  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/proyectos");
  revalidatePath("/");
}

export async function addProjectMember(formData: FormData) {
  await requireAuth();
  const projectId = str(formData, "projectId");
  const teamMemberId = str(formData, "teamMemberId");
  if (!projectId || !teamMemberId) throw new Error("Faltan datos");

  await prisma.projectMember.upsert({
    where: { projectId_teamMemberId: { projectId, teamMemberId } },
    update: {
      roleOnProject: str(formData, "roleOnProject") || "Consultor/a",
      allocationHoursPerWeek: nonNeg(formData, "allocationHoursPerWeek"),
    },
    create: {
      projectId,
      teamMemberId,
      roleOnProject: str(formData, "roleOnProject") || "Consultor/a",
      allocationHoursPerWeek: nonNeg(formData, "allocationHoursPerWeek"),
    },
  });

  revalidatePath(`/proyectos/${projectId}`);
}

export async function createTask(formData: FormData) {
  await requireAuth();
  const projectId = str(formData, "projectId");
  const title = str(formData, "title");
  if (!projectId || !title) throw new Error("Faltan datos");

  const dueDate = str(formData, "dueDate");

  const recent = await prisma.task.findFirst({ where: { projectId, title, createdAt: { gte: justNow() } }, select: { id: true } });
  if (recent) {
    revalidatePath(`/proyectos/${projectId}`);
    return;
  }

  await prisma.task.create({
    data: {
      projectId,
      title,
      description: str(formData, "description") || null,
      priority: oneOf<TaskPriority>(str(formData, "priority"), TASK_PRIORITIES, "MEDIA"),
      status: "PENDIENTE",
      dueDate: dueDate ? dateOf(dueDate) : null,
      assigneeId: str(formData, "assigneeId") || null,
    },
  });

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/");
}

export async function updateTaskStatus(formData: FormData) {
  await requireAuth();
  const taskId = str(formData, "taskId");
  const projectId = str(formData, "projectId");
  const status = oneOf<TaskStatus>(str(formData, "status"), TASK_STATUSES);
  if (!taskId || !projectId) throw new Error("Faltan datos");
  await prisma.task.updateMany({ where: { id: taskId, projectId }, data: { status } });
  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/");
}

export async function createTimeEntry(formData: FormData) {
  await requireAuth();
  const projectId = str(formData, "projectId");
  const teamMemberId = str(formData, "teamMemberId");
  const hours = nonNeg(formData, "hours");
  const date = str(formData, "date");
  if (!projectId || !teamMemberId || !hours || !date) throw new Error("Faltan datos");

  const recentEntry = await prisma.timeEntry.findFirst({
    where: { projectId, teamMemberId, hours, date: dateOf(date), createdAt: { gte: justNow() } },
    select: { id: true },
  });
  if (recentEntry) {
    revalidatePath(`/proyectos/${projectId}`);
    return;
  }

  await prisma.timeEntry.create({
    data: {
      projectId,
      teamMemberId,
      taskId: str(formData, "taskId") || null,
      budgetItemId: await validItemId(projectId, str(formData, "budgetItemId")),
      date: dateOf(date),
      hours,
      billable: formData.get("billable") === "on",
      note: str(formData, "note") || null,
    },
  });

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/");
}

// ---------- Edición de registros ya cargados ----------

export async function updateTimeEntry(formData: FormData) {
  await requireAuth();
  const entryId = str(formData, "entryId");
  const projectId = str(formData, "projectId");
  const teamMemberId = str(formData, "teamMemberId");
  const hours = nonNeg(formData, "hours");
  const date = str(formData, "date");
  if (!entryId || !projectId || !teamMemberId || !hours || !date) throw new Error("Faltan datos");

  await prisma.timeEntry.update({
    where: { id: entryId },
    data: {
      teamMemberId,
      taskId: str(formData, "taskId") || null,
      budgetItemId: await validItemId(projectId, str(formData, "budgetItemId")),
      date: dateOf(date),
      hours,
      billable: formData.get("billable") === "on",
    },
  });

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/proyectos");
  revalidatePath("/");
}

export async function updateProjectMember(formData: FormData) {
  await requireAuth();
  const memberId = str(formData, "memberId");
  const projectId = str(formData, "projectId");
  if (!memberId || !projectId) throw new Error("Faltan datos");

  await prisma.projectMember.update({
    where: { id: memberId },
    data: {
      roleOnProject: str(formData, "roleOnProject") || "Consultor/a",
      allocationHoursPerWeek: nonNeg(formData, "allocationHoursPerWeek"),
    },
  });

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/equipo");
  revalidatePath("/");
}

export async function updateTask(formData: FormData) {
  await requireAuth();
  const taskId = str(formData, "taskId");
  const projectId = str(formData, "projectId");
  const title = str(formData, "title");
  if (!taskId || !projectId || !title) throw new Error("Faltan datos");

  const dueDate = str(formData, "dueDate");

  await prisma.task.update({
    where: { id: taskId },
    data: {
      title,
      priority: oneOf<TaskPriority>(str(formData, "priority"), TASK_PRIORITIES, "MEDIA"),
      assigneeId: str(formData, "assigneeId") || null,
      dueDate: dueDate ? dateOf(dueDate) : null,
    },
  });

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/");
}

// ---------- Ítems del presupuesto de horas ----------

export async function addBudgetItem(formData: FormData) {
  await requireAuth();
  const projectId = str(formData, "projectId");
  const name = str(formData, "name");
  if (!projectId || !name) throw new Error("Faltan datos");

  // Un ítem con el mismo nombre en el mismo proyecto es casi seguro un doble envío: no se repite.
  const existing = await prisma.budgetItem.findFirst({ where: { projectId, name: { equals: name, mode: "insensitive" } }, select: { id: true } });
  if (existing) {
    revalidateProject(projectId);
    return;
  }

  const last = await prisma.budgetItem.findFirst({ where: { projectId }, orderBy: { order: "desc" }, select: { order: true } });
  await prisma.budgetItem.create({
    data: {
      projectId,
      name,
      hours: nonNeg(formData, "hours"),
      hourlyRate: nonNeg(formData, "hourlyRate"),
      order: (last?.order ?? -1) + 1,
    },
  });
  await syncBudgetTotals(projectId);
  revalidateProject(projectId);
}

export async function updateBudgetItem(formData: FormData) {
  await requireAuth();
  const itemId = str(formData, "itemId");
  const projectId = str(formData, "projectId");
  const name = str(formData, "name");
  if (!itemId || !projectId || !name) throw new Error("Faltan datos");

  // where con projectId: no se puede editar un ítem de otro proyecto.
  await prisma.budgetItem.updateMany({
    where: { id: itemId, projectId },
    data: { name, hours: nonNeg(formData, "hours"), hourlyRate: nonNeg(formData, "hourlyRate") },
  });
  await syncBudgetTotals(projectId);
  revalidateProject(projectId);
}

// Las horas ya cargadas NO se borran: quedan sin ítem (ON DELETE SET NULL).
export async function deleteBudgetItem(formData: FormData) {
  await requireAuth();
  const itemId = str(formData, "itemId");
  const projectId = str(formData, "projectId");
  if (!itemId || !projectId) throw new Error("Faltan datos");

  await prisma.budgetItem.deleteMany({ where: { id: itemId, projectId } });
  await syncBudgetTotals(projectId);
  revalidateProject(projectId);
}

// ---------- Borrado ----------
// Siempre filtran también por projectId: no se puede borrar un registro de otro proyecto.

// Las horas cargadas a la tarea NO se borran: quedan sin tarea (ON DELETE SET NULL).
export async function deleteTask(formData: FormData) {
  await requireAuth();
  const taskId = str(formData, "taskId");
  const projectId = str(formData, "projectId");
  if (!taskId || !projectId) throw new Error("Faltan datos");

  await prisma.task.deleteMany({ where: { id: taskId, projectId } });
  revalidateProject(projectId);
}

export async function deleteTimeEntry(formData: FormData) {
  await requireAuth();
  const entryId = str(formData, "entryId");
  const projectId = str(formData, "projectId");
  if (!entryId || !projectId) throw new Error("Faltan datos");

  await prisma.timeEntry.deleteMany({ where: { id: entryId, projectId } });
  revalidateProject(projectId);
}

// Quita al consultor del proyecto; sus horas ya cargadas se conservan.
export async function removeProjectMember(formData: FormData) {
  await requireAuth();
  const memberId = str(formData, "memberId");
  const projectId = str(formData, "projectId");
  if (!memberId || !projectId) throw new Error("Faltan datos");

  await prisma.projectMember.deleteMany({ where: { id: memberId, projectId } });
  revalidateProject(projectId);
}
