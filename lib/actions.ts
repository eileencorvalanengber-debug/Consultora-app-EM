"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ProjectStatus, Sentido, TaskPriority, TaskStatus } from "@prisma/client";

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}
function num(fd: FormData, key: string): number {
  const v = Number(fd.get(key));
  return Number.isFinite(v) ? v : 0;
}

export async function upsertKpiMeasurement(formData: FormData) {
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
      sentido: str(formData, "sentido") as Sentido,
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
  const name = str(formData, "name");
  if (!name) throw new Error("El nombre es obligatorio");

  await prisma.teamMember.create({
    data: {
      name,
      email: str(formData, "email") || null,
      role: str(formData, "role") || "Consultor/a",
      weeklyCapacityHours: num(formData, "weeklyCapacityHours") || 40,
    },
  });

  revalidatePath("/equipo");
}

export async function updateTeamMember(formData: FormData) {
  const teamMemberId = str(formData, "teamMemberId");
  const name = str(formData, "name");
  if (!teamMemberId || !name) throw new Error("El nombre es obligatorio");

  await prisma.teamMember.update({
    where: { id: teamMemberId },
    data: {
      name,
      email: str(formData, "email") || null,
      role: str(formData, "role") || "Consultor/a",
      weeklyCapacityHours: num(formData, "weeklyCapacityHours") || 40,
    },
  });

  revalidatePath("/equipo");
  redirect("/equipo");
}

export async function createProject(formData: FormData) {
  const name = str(formData, "name");
  const clientId = str(formData, "clientId");
  if (!name || !clientId) throw new Error("Nombre y cliente son obligatorios");

  const project = await prisma.project.create({
    data: {
      name,
      clientId,
      description: str(formData, "description") || null,
      status: (str(formData, "status") || "PLANIFICACION") as ProjectStatus,
      startDate: new Date(str(formData, "startDate")),
      endDate: new Date(str(formData, "endDate")),
      budgetHours: num(formData, "budgetHours"),
      budgetAmount: num(formData, "budgetAmount"),
      hourlyRate: num(formData, "hourlyRate"),
      progressPercent: 0,
    },
  });

  revalidatePath("/proyectos");
  redirect(`/proyectos/${project.id}`);
}

export async function updateProjectStatus(formData: FormData) {
  const projectId = str(formData, "projectId");
  const status = str(formData, "status") as ProjectStatus;
  await prisma.project.update({ where: { id: projectId }, data: { status } });
  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/proyectos");
  revalidatePath("/");
}

export async function updateProjectBudget(formData: FormData) {
  const projectId = str(formData, "projectId");
  await prisma.project.update({
    where: { id: projectId },
    data: {
      budgetAmount: num(formData, "budgetAmount"),
      budgetHours: num(formData, "budgetHours"),
      hourlyRate: num(formData, "hourlyRate"),
    },
  });
  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/proyectos");
  revalidatePath("/");
}

export async function updateProjectProgress(formData: FormData) {
  const projectId = str(formData, "projectId");
  const progressPercent = Math.max(0, Math.min(100, num(formData, "progressPercent")));
  await prisma.project.update({ where: { id: projectId }, data: { progressPercent } });
  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/proyectos");
  revalidatePath("/");
}

export async function addProjectMember(formData: FormData) {
  const projectId = str(formData, "projectId");
  const teamMemberId = str(formData, "teamMemberId");
  if (!projectId || !teamMemberId) throw new Error("Faltan datos");

  await prisma.projectMember.upsert({
    where: { projectId_teamMemberId: { projectId, teamMemberId } },
    update: {
      roleOnProject: str(formData, "roleOnProject") || "Consultor/a",
      allocationHoursPerWeek: num(formData, "allocationHoursPerWeek"),
    },
    create: {
      projectId,
      teamMemberId,
      roleOnProject: str(formData, "roleOnProject") || "Consultor/a",
      allocationHoursPerWeek: num(formData, "allocationHoursPerWeek"),
    },
  });

  revalidatePath(`/proyectos/${projectId}`);
}

export async function createTask(formData: FormData) {
  const projectId = str(formData, "projectId");
  const title = str(formData, "title");
  if (!projectId || !title) throw new Error("Faltan datos");

  const dueDate = str(formData, "dueDate");

  await prisma.task.create({
    data: {
      projectId,
      title,
      description: str(formData, "description") || null,
      priority: (str(formData, "priority") || "MEDIA") as TaskPriority,
      status: "PENDIENTE",
      dueDate: dueDate ? new Date(dueDate) : null,
      assigneeId: str(formData, "assigneeId") || null,
    },
  });

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/");
}

export async function updateTaskStatus(formData: FormData) {
  const taskId = str(formData, "taskId");
  const projectId = str(formData, "projectId");
  const status = str(formData, "status") as TaskStatus;
  await prisma.task.update({ where: { id: taskId }, data: { status } });
  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/");
}

export async function createTimeEntry(formData: FormData) {
  const projectId = str(formData, "projectId");
  const teamMemberId = str(formData, "teamMemberId");
  const hours = num(formData, "hours");
  const date = str(formData, "date");
  if (!projectId || !teamMemberId || !hours || !date) throw new Error("Faltan datos");

  await prisma.timeEntry.create({
    data: {
      projectId,
      teamMemberId,
      taskId: str(formData, "taskId") || null,
      date: new Date(date),
      hours,
      billable: formData.get("billable") === "on",
      note: str(formData, "note") || null,
    },
  });

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/");
}
