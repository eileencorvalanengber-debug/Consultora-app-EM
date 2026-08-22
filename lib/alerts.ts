import { prisma } from "@/lib/prisma";
import { daysBetween } from "@/lib/format";

export type AlertSeverity = "critica" | "advertencia" | "info";

export type Alert = {
  id: string;
  severity: AlertSeverity;
  category: string;
  title: string;
  description: string;
  href: string;
};

const SEVERITY_RANK: Record<AlertSeverity, number> = {
  critica: 0,
  advertencia: 1,
  info: 2,
};

export async function getAlerts(): Promise<Alert[]> {
  const now = new Date();

  const projects = await prisma.project.findMany({
    where: { status: { not: "COMPLETADO" } },
    include: {
      client: true,
      tasks: true,
      timeEntries: true,
      members: { include: { teamMember: true } },
    },
  });

  const alerts: Alert[] = [];

  for (const project of projects) {
    const projectHref = `/proyectos/${project.id}`;

    for (const task of project.tasks) {
      if (task.status === "COMPLETADA" || !task.dueDate) continue;
      const diff = daysBetween(now, task.dueDate);
      if (diff < 0) {
        alerts.push({
          id: `task-overdue-${task.id}`,
          severity: "critica",
          category: "Vencimiento",
          title: `Tarea vencida: "${task.title}"`,
          description: `${project.name} · venció hace ${Math.abs(diff)} día(s)`,
          href: projectHref,
        });
      } else if (diff <= 3) {
        alerts.push({
          id: `task-due-soon-${task.id}`,
          severity: "advertencia",
          category: "Vencimiento",
          title: `Tarea por vencer: "${task.title}"`,
          description: `${project.name} · vence en ${diff} día(s)`,
          href: projectHref,
        });
      }
    }

    if (project.budgetHours > 0) {
      const hoursUsed = project.timeEntries.reduce((s, e) => s + e.hours, 0);
      const ratio = hoursUsed / project.budgetHours;
      if (ratio >= 1) {
        alerts.push({
          id: `budget-over-${project.id}`,
          severity: "critica",
          category: "Presupuesto",
          title: `Presupuesto de horas excedido`,
          description: `${project.name} · ${hoursUsed.toFixed(0)}h cargadas de ${project.budgetHours.toFixed(0)}h presupuestadas (${Math.round(ratio * 100)}%)`,
          href: projectHref,
        });
      } else if (ratio >= 0.85) {
        alerts.push({
          id: `budget-warn-${project.id}`,
          severity: "advertencia",
          category: "Presupuesto",
          title: `Presupuesto de horas cerca del límite`,
          description: `${project.name} · ${Math.round(ratio * 100)}% de las horas presupuestadas ya cargadas`,
          href: projectHref,
        });
      }
    }

    if (project.status === "EN_CURSO") {
      const lastEntry = project.timeEntries.reduce<Date | null>((latest, e) => {
        return !latest || e.date > latest ? e.date : latest;
      }, null);
      const referenceDate = lastEntry ?? project.createdAt;
      const idleDays = daysBetween(referenceDate, now);
      if (idleDays >= 14) {
        alerts.push({
          id: `idle-${project.id}`,
          severity: "advertencia",
          category: "Sin actividad",
          title: `Proyecto sin carga de horas`,
          description: `${project.name} · sin actividad hace ${idleDays} días`,
          href: projectHref,
        });
      }
    }

    const daysToEnd = daysBetween(now, project.endDate);
    if (daysToEnd >= 0 && daysToEnd <= 7 && project.progressPercent < 90 && project.status !== "PAUSADO") {
      alerts.push({
        id: `deadline-${project.id}`,
        severity: "critica",
        category: "Cronograma",
        title: `Fecha de entrega próxima con avance bajo`,
        description: `${project.name} · vence en ${daysToEnd} día(s), ${project.progressPercent}% completado`,
        href: projectHref,
      });
    } else if (daysToEnd < 0 && project.status !== "PAUSADO") {
      alerts.push({
        id: `overdue-project-${project.id}`,
        severity: "critica",
        category: "Cronograma",
        title: `Proyecto fuera de fecha`,
        description: `${project.name} · debía finalizar hace ${Math.abs(daysToEnd)} día(s)`,
        href: projectHref,
      });
    }

    if (project.status === "EN_RIESGO") {
      alerts.push({
        id: `flagged-risk-${project.id}`,
        severity: "advertencia",
        category: "Estado",
        title: `Proyecto marcado en riesgo`,
        description: `${project.name} · cliente: ${project.client.name}`,
        href: projectHref,
      });
    }
  }

  // Sobrecarga de equipo: suma de asignaciones activas vs capacidad semanal
  const members = await prisma.teamMember.findMany({
    where: { active: true },
    include: {
      assignments: {
        include: { project: true },
      },
    },
  });

  for (const member of members) {
    const activeLoad = member.assignments
      .filter((a) => a.project.status === "EN_CURSO" || a.project.status === "EN_RIESGO")
      .reduce((s, a) => s + a.allocationHoursPerWeek, 0);
    if (activeLoad > member.weeklyCapacityHours) {
      alerts.push({
        id: `overload-${member.id}`,
        severity: "advertencia",
        category: "Equipo",
        title: `Sobrecarga de ${member.name}`,
        description: `Asignado a ${activeLoad.toFixed(0)}h/semana sobre una capacidad de ${member.weeklyCapacityHours.toFixed(0)}h/semana`,
        href: `/equipo`,
      });
    }
  }

  alerts.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
  return alerts;
}
