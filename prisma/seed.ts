import { PrismaClient, ProjectStatus, TaskPriority, TaskStatus } from "@prisma/client";

const prisma = new PrismaClient();

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

async function addWeeklyEntries(
  projectId: string,
  members: { teamMemberId: string; hoursPerWeek: number }[],
  startDaysAgo: number,
  stopDaysAgo: number // entries stop this many days before today (0 = up to today)
) {
  let cursor = -startDaysAgo;
  while (cursor <= -stopDaysAgo) {
    for (const m of members) {
      if (m.hoursPerWeek <= 0) continue;
      await prisma.timeEntry.create({
        data: {
          projectId,
          teamMemberId: m.teamMemberId,
          date: daysFromNow(cursor),
          hours: m.hoursPerWeek,
          billable: true,
        },
      });
    }
    cursor += 7;
  }
}

async function main() {
  console.log("Limpiando base de datos...");
  await prisma.timeEntry.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.client.deleteMany();

  console.log("Creando clientes...");
  const bancoSur = await prisma.client.create({
    data: {
      name: "Banco Sur",
      industry: "Finanzas",
      contactName: "Roberto Iglesias",
      contactEmail: "roberto.iglesias@bancosur.com",
      contactPhone: "+54 11 4555-0101",
    },
  });
  const retailAndina = await prisma.client.create({
    data: {
      name: "Retail Andina",
      industry: "Retail",
      contactName: "Carla Núñez",
      contactEmail: "carla.nunez@retailandina.com",
      contactPhone: "+54 11 4555-0202",
    },
  });
  const grupoMinero = await prisma.client.create({
    data: {
      name: "Grupo Minero Cordillera",
      industry: "Minería",
      contactName: "Felipe Aranda",
      contactEmail: "faranda@cordillera.com",
      contactPhone: "+54 261 400-0303",
    },
  });
  const saludIntegral = await prisma.client.create({
    data: {
      name: "Salud Integral",
      industry: "Salud",
      contactName: "Marcela Ríos",
      contactEmail: "mrios@saludintegral.com",
      contactPhone: "+54 351 400-0404",
    },
  });

  console.log("Creando equipo...");
  const lucia = await prisma.teamMember.create({
    data: { name: "Lucía Fernández", email: "lucia@consultora.com", role: "Directora de Proyectos", weeklyCapacityHours: 40 },
  });
  const martin = await prisma.teamMember.create({
    data: { name: "Martín Alonso", email: "martin@consultora.com", role: "Consultor Senior", weeklyCapacityHours: 40 },
  });
  const sofia = await prisma.teamMember.create({
    data: { name: "Sofía Ramírez", email: "sofia@consultora.com", role: "Consultora de Datos", weeklyCapacityHours: 40 },
  });
  const diego = await prisma.teamMember.create({
    data: { name: "Diego Torres", email: "diego@consultora.com", role: "Consultor de Procesos", weeklyCapacityHours: 20 },
  });
  const valentina = await prisma.teamMember.create({
    data: { name: "Valentina Cruz", email: "valentina@consultora.com", role: "Analista", weeklyCapacityHours: 30 },
  });
  const nicolas = await prisma.teamMember.create({
    data: { name: "Nicolás Paredes", email: "nicolas@consultora.com", role: "Consultor Senior", weeklyCapacityHours: 40 },
  });

  console.log("Creando proyectos...");

  // P1: en curso, cerca de la fecha límite con avance medio, presupuesto cerca del límite,
  // con una tarea vencida y otra por vencer.
  const p1 = await prisma.project.create({
    data: {
      name: "Optimización de procesos de atención",
      description: "Rediseño de los procesos de atención al cliente en sucursales.",
      status: ProjectStatus.EN_CURSO,
      clientId: bancoSur.id,
      startDate: daysFromNow(-60),
      endDate: daysFromNow(5),
      budgetHours: 400,
      budgetAmount: 40000,
      hourlyRate: 85,
      progressPercent: 60,
    },
  });
  await prisma.projectMember.createMany({
    data: [
      { projectId: p1.id, teamMemberId: lucia.id, roleOnProject: "Directora", allocationHoursPerWeek: 15 },
      { projectId: p1.id, teamMemberId: sofia.id, roleOnProject: "Consultora de Datos", allocationHoursPerWeek: 20 },
    ],
  });
  await prisma.task.createMany({
    data: [
      { projectId: p1.id, title: "Relevar procesos actuales en sucursales piloto", status: TaskStatus.COMPLETADA, priority: TaskPriority.ALTA, dueDate: daysFromNow(-30), assigneeId: sofia.id },
      { projectId: p1.id, title: "Definir nuevos flujos de atención", status: TaskStatus.COMPLETADA, priority: TaskPriority.ALTA, dueDate: daysFromNow(-15), assigneeId: lucia.id },
      { projectId: p1.id, title: "Validar flujos con gerentes de sucursal", status: TaskStatus.EN_CURSO, priority: TaskPriority.ALTA, dueDate: daysFromNow(-3), assigneeId: lucia.id },
      { projectId: p1.id, title: "Entregar manual de procesos actualizado", status: TaskStatus.PENDIENTE, priority: TaskPriority.MEDIA, dueDate: daysFromNow(2), assigneeId: sofia.id },
      { projectId: p1.id, title: "Capacitar a equipos piloto", status: TaskStatus.PENDIENTE, priority: TaskPriority.MEDIA, dueDate: daysFromNow(10), assigneeId: sofia.id },
    ],
  });
  await addWeeklyEntries(p1.id, [{ teamMemberId: lucia.id, hoursPerWeek: 15 }, { teamMemberId: sofia.id, hoursPerWeek: 20 }], 60, 0);

  // P2: en riesgo, presupuesto excedido, con tarea bloqueada.
  const p2 = await prisma.project.create({
    data: {
      name: "Implementación de CRM",
      description: "Puesta en marcha de un CRM unificado para todas las tiendas.",
      status: ProjectStatus.EN_RIESGO,
      clientId: retailAndina.id,
      startDate: daysFromNow(-90),
      endDate: daysFromNow(30),
      budgetHours: 600,
      budgetAmount: 72000,
      hourlyRate: 95,
      progressPercent: 70,
    },
  });
  await prisma.projectMember.createMany({
    data: [
      { projectId: p2.id, teamMemberId: martin.id, roleOnProject: "Consultor Senior", allocationHoursPerWeek: 25 },
      { projectId: p2.id, teamMemberId: diego.id, roleOnProject: "Consultor de Procesos", allocationHoursPerWeek: 20 },
    ],
  });
  await prisma.task.createMany({
    data: [
      { projectId: p2.id, title: "Migrar base de contactos histórica", status: TaskStatus.COMPLETADA, priority: TaskPriority.ALTA, dueDate: daysFromNow(-40), assigneeId: martin.id },
      { projectId: p2.id, title: "Integrar CRM con sistema de ventas", status: TaskStatus.BLOQUEADA, priority: TaskPriority.ALTA, dueDate: daysFromNow(-5), assigneeId: diego.id },
      { projectId: p2.id, title: "Configurar reportes de gerencia", status: TaskStatus.EN_CURSO, priority: TaskPriority.MEDIA, dueDate: daysFromNow(8), assigneeId: martin.id },
    ],
  });
  await addWeeklyEntries(p2.id, [{ teamMemberId: martin.id, hoursPerWeek: 34 }, { teamMemberId: diego.id, hoursPerWeek: 16 }], 90, 0);

  // P3: en curso pero sin actividad reciente (más de 14 días sin horas cargadas).
  const p3 = await prisma.project.create({
    data: {
      name: "Auditoría de datos operativos",
      description: "Auditoría y limpieza de datos operativos de las plantas mineras.",
      status: ProjectStatus.EN_CURSO,
      clientId: grupoMinero.id,
      startDate: daysFromNow(-40),
      endDate: daysFromNow(25),
      budgetHours: 300,
      budgetAmount: 27000,
      hourlyRate: 90,
      progressPercent: 40,
    },
  });
  await prisma.projectMember.createMany({
    data: [
      { projectId: p3.id, teamMemberId: sofia.id, roleOnProject: "Consultora de Datos", allocationHoursPerWeek: 10 },
      { projectId: p3.id, teamMemberId: valentina.id, roleOnProject: "Analista", allocationHoursPerWeek: 15 },
      { projectId: p3.id, teamMemberId: diego.id, roleOnProject: "Consultor de Procesos", allocationHoursPerWeek: 15 },
    ],
  });
  await prisma.task.createMany({
    data: [
      { projectId: p3.id, title: "Inventariar fuentes de datos", status: TaskStatus.COMPLETADA, priority: TaskPriority.MEDIA, dueDate: daysFromNow(-25), assigneeId: valentina.id },
      { projectId: p3.id, title: "Detectar inconsistencias en registros de producción", status: TaskStatus.EN_CURSO, priority: TaskPriority.ALTA, dueDate: daysFromNow(15), assigneeId: sofia.id },
      { projectId: p3.id, title: "Diseñar tablero de calidad de datos", status: TaskStatus.PENDIENTE, priority: TaskPriority.BAJA, dueDate: daysFromNow(20), assigneeId: valentina.id },
    ],
  });
  // Sin actividad en los últimos 20 días para disparar la alerta de inactividad
  await addWeeklyEntries(p3.id, [{ teamMemberId: sofia.id, hoursPerWeek: 10 }, { teamMemberId: valentina.id, hoursPerWeek: 15 }], 40, 20);

  // P4: planificación, todavía sin horas cargadas.
  const p4 = await prisma.project.create({
    data: {
      name: "Rediseño de experiencia del paciente",
      description: "Rediseño del recorrido del paciente en centros de atención ambulatoria.",
      status: ProjectStatus.PLANIFICACION,
      clientId: saludIntegral.id,
      startDate: daysFromNow(10),
      endDate: daysFromNow(100),
      budgetHours: 500,
      budgetAmount: 45000,
      hourlyRate: 90,
      progressPercent: 0,
    },
  });
  await prisma.projectMember.create({
    data: { projectId: p4.id, teamMemberId: nicolas.id, roleOnProject: "Consultor Senior", allocationHoursPerWeek: 10 },
  });
  await prisma.task.createMany({
    data: [
      { projectId: p4.id, title: "Kickoff con comité directivo", status: TaskStatus.PENDIENTE, priority: TaskPriority.ALTA, dueDate: daysFromNow(12), assigneeId: nicolas.id },
      { projectId: p4.id, title: "Definir alcance y entregables", status: TaskStatus.PENDIENTE, priority: TaskPriority.MEDIA, dueDate: daysFromNow(20), assigneeId: nicolas.id },
    ],
  });

  // P5: en curso pero fuera de fecha (venció hace unos días).
  const p5 = await prisma.project.create({
    data: {
      name: "Reestructuración financiera",
      description: "Plan de reestructuración de costos operativos a nivel corporativo.",
      status: ProjectStatus.EN_CURSO,
      clientId: bancoSur.id,
      startDate: daysFromNow(-120),
      endDate: daysFromNow(-5),
      budgetHours: 700,
      budgetAmount: 91000,
      hourlyRate: 130,
      progressPercent: 80,
    },
  });
  await prisma.projectMember.createMany({
    data: [
      { projectId: p5.id, teamMemberId: lucia.id, roleOnProject: "Directora", allocationHoursPerWeek: 10 },
      { projectId: p5.id, teamMemberId: martin.id, roleOnProject: "Consultor Senior", allocationHoursPerWeek: 10 },
    ],
  });
  await prisma.task.createMany({
    data: [
      { projectId: p5.id, title: "Presentar plan a directorio", status: TaskStatus.COMPLETADA, priority: TaskPriority.ALTA, dueDate: daysFromNow(-30), assigneeId: lucia.id },
      { projectId: p5.id, title: "Cerrar informe final de ahorro", status: TaskStatus.EN_CURSO, priority: TaskPriority.ALTA, dueDate: daysFromNow(-2), assigneeId: martin.id },
    ],
  });
  await addWeeklyEntries(p5.id, [{ teamMemberId: lucia.id, hoursPerWeek: 10 }, { teamMemberId: martin.id, hoursPerWeek: 10 }], 120, 10);

  // P6: completado, para poblar histórico sin generar alertas.
  const p6 = await prisma.project.create({
    data: {
      name: "Plan de expansión regional",
      description: "Plan estratégico de apertura de nuevas tiendas en la región.",
      status: ProjectStatus.COMPLETADO,
      clientId: retailAndina.id,
      startDate: daysFromNow(-200),
      endDate: daysFromNow(-30),
      budgetHours: 350,
      budgetAmount: 38500,
      hourlyRate: 110,
      progressPercent: 100,
    },
  });
  await prisma.projectMember.create({
    data: { projectId: p6.id, teamMemberId: nicolas.id, roleOnProject: "Consultor Senior", allocationHoursPerWeek: 12 },
  });
  await prisma.task.createMany({
    data: [
      { projectId: p6.id, title: "Entrega final del plan estratégico", status: TaskStatus.COMPLETADA, priority: TaskPriority.ALTA, dueDate: daysFromNow(-32), assigneeId: nicolas.id },
    ],
  });

  console.log("Seed completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
