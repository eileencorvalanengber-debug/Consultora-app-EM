-- CreateEnum
CREATE TYPE "Perspective" AS ENUM ('FINANCIERA', 'CLIENTES', 'PROCESOS_INTERNOS', 'APRENDIZAJE_CRECIMIENTO');

-- CreateEnum
CREATE TYPE "Sentido" AS ENUM ('MAYOR', 'MENOR');

-- CreateTable
CREATE TABLE "StrategicObjective" (
    "id" TEXT NOT NULL,
    "perspective" "Perspective" NOT NULL,
    "objective" TEXT NOT NULL,
    "kpiName" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "sentido" "Sentido" NOT NULL,
    "frequency" TEXT NOT NULL,
    "responsible" TEXT NOT NULL,
    "justification" TEXT,
    "priorityInitiative" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StrategicObjective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiMeasurement" (
    "id" TEXT NOT NULL,
    "objectiveId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "resultValue" DOUBLE PRECISION,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KpiMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KpiMeasurement_objectiveId_year_month_key" ON "KpiMeasurement"("objectiveId", "year", "month");

-- AddForeignKey
ALTER TABLE "KpiMeasurement" ADD CONSTRAINT "KpiMeasurement_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "StrategicObjective"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Seed the 16 strategic objectives from the original BSC spreadsheet
INSERT INTO "StrategicObjective" ("id", "perspective", "objective", "kpiName", "unit", "targetValue", "sentido", "frequency", "responsible", "justification", "priorityInitiative", "order") VALUES
('F1', 'FINANCIERA', 'Lograr crecimiento comercial sostenible', 'Crecimiento de ingresos acumulados vs. año anterior', '%', 25, 'MAYOR', 'Mensual', 'Gerencia General', 'Consolidar el segundo año con expansión controlada y evidencia de tracción comercial.', NULL, 0),
('F2', 'FINANCIERA', 'Mejorar la rentabilidad de los proyectos', 'Margen bruto promedio de proyectos', '%', 35, 'MAYOR', 'Mensual', 'Gerencia General', 'Proteger margen mediante costeo, control de HH, alcance y proveedores.', NULL, 1),
('F3', 'FINANCIERA', 'Reducir concentración de ingresos', 'Participación del cliente principal en ingresos', '%', 30, 'MENOR', 'Trimestral', 'Gerencia General', 'Disminuir dependencia de un solo mandante y diversificar cartera.', NULL, 2),
('F4', 'FINANCIERA', 'Fortalecer liquidez y cobranza', 'Facturas cobradas dentro de 45 días', '%', 90, 'MAYOR', 'Mensual', 'Administración', 'Asegurar caja para sostener operación y crecimiento.', NULL, 3),
('C1', 'CLIENTES', 'Aumentar la base de clientes activos', 'Clientes institucionales/empresariales activos en 12 meses', 'N°', 8, 'MAYOR', 'Mensual', 'Gerencia General', 'Priorizar empresas, educación superior y colegios.', NULL, 4),
('C2', 'CLIENTES', 'Impulsar recurrencia y fidelización', 'Clientes con recompra o nuevo proyecto en 12 meses', '%', 50, 'MAYOR', 'Trimestral', 'Gerencia General', 'Convertir proyectos puntuales en relaciones de mediano plazo.', NULL, 5),
('C3', 'CLIENTES', 'Elevar satisfacción y recomendación', 'NPS o índice equivalente de recomendación', 'Puntos', 60, 'MAYOR', 'Por proyecto', 'Calidad y Mejora Continua', 'Medir percepción al cierre y activar planes de mejora.', NULL, 6),
('C4', 'CLIENTES', 'Mejorar efectividad comercial', 'Propuestas adjudicadas / propuestas emitidas', '%', 35, 'MAYOR', 'Mensual', 'Gerencia General', 'Gestionar embudo comercial y calidad de propuestas.', NULL, 7),
('P1', 'PROCESOS_INTERNOS', 'Cumplir proyectos en plazo y alcance', 'Hitos entregados en fecha comprometida', '%', 95, 'MAYOR', 'Mensual', 'Dirección de Proyectos', 'Controlar cronograma, alcance, riesgos y dependencias.', NULL, 8),
('P2', 'PROCESOS_INTERNOS', 'Asegurar calidad técnica de entregables', 'Entregables aprobados sin retrabajo mayor', '%', 90, 'MAYOR', 'Mensual', 'Calidad y Mejora Continua', 'Operacionalizar el valor ''Rigor que transforma''.', NULL, 9),
('P3', 'PROCESOS_INTERNOS', 'Estandarizar el método de trabajo', 'Proyectos que aplican diagnóstico-diseño-implementación-evaluación-mejora', '%', 100, 'MAYOR', 'Trimestral', 'Dirección de Proyectos', 'Convertir el framework institucional en estándar operativo auditable.', NULL, 10),
('P4', 'PROCESOS_INTERNOS', 'Acelerar respuesta comercial', 'Tiempo medio desde requerimiento calificado a propuesta', 'Días', 5, 'MENOR', 'Mensual', 'Gerencia General', 'Reducir fricción en la captación sin deteriorar pertinencia técnica.', NULL, 11),
('A1', 'APRENDIZAJE_CRECIMIENTO', 'Fortalecer capacidades del equipo y red', 'Profesionales clave con actualización anual en IA, calidad o diseño educativo', '%', 90, 'MAYOR', 'Semestral', 'Calidad y Mejora Continua', 'Sostener innovación pedagógica y uso responsable de IA.', NULL, 12),
('A2', 'APRENDIZAJE_CRECIMIENTO', 'Construir capital de conocimiento reutilizable', 'Proyectos con lecciones aprendidas y activos reutilizables documentados', '%', 90, 'MAYOR', 'Trimestral', 'Dirección de Proyectos', 'Evitar pérdida de conocimiento y mejorar productividad futura.', NULL, 13),
('A3', 'APRENDIZAJE_CRECIMIENTO', 'Desarrollar capacidad flexible de ejecución', 'Cobertura de perfiles críticos mediante staff/red de especialistas', '%', 100, 'MAYOR', 'Trimestral', 'Gerencia General', 'Asegurar capacidad para las tres líneas de servicio y picos de demanda.', NULL, 14),
('A4', 'APRENDIZAJE_CRECIMIENTO', 'Instalar cultura de datos y mejora continua', 'Reuniones BSC realizadas con acuerdos y responsables', '%', 100, 'MAYOR', 'Mensual', 'Gerencia General', 'Usar evidencia, transparencia y mejora continua como rutina de gestión.', NULL, 15);
