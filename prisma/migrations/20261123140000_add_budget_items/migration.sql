-- Presupuesto de horas por ítems, cada uno con su tarifa.
-- Migración aditiva: no borra ni modifica columnas existentes.

-- CreateTable
CREATE TABLE "BudgetItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hourlyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetItem_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "TimeEntry" ADD COLUMN "budgetItemId" TEXT;

-- CreateIndex
CREATE INDEX "BudgetItem_projectId_idx" ON "BudgetItem"("projectId");

-- CreateIndex
CREATE INDEX "TimeEntry_budgetItemId_idx" ON "TimeEntry"("budgetItemId");

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_budgetItemId_fkey" FOREIGN KEY ("budgetItemId") REFERENCES "BudgetItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Respaldo de datos: cada proyecto que ya tenía horas o tarifa queda con un ítem "General"
-- con esos mismos valores, de modo que nada cambia en lo que ve hoy.
INSERT INTO "BudgetItem" ("id", "projectId", "name", "hours", "hourlyRate", "order")
SELECT 'general_' || "id", "id", 'General', "budgetHours", "hourlyRate", 0
FROM "Project"
WHERE "budgetHours" > 0 OR "hourlyRate" > 0;
