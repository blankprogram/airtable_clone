/*
  Warnings:

  - A unique constraint covering the columns `[rowId,columnId]` on the table `Cell` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Cell" DROP CONSTRAINT "Cell_columnId_fkey";

-- DropForeignKey
ALTER TABLE "Cell" DROP CONSTRAINT "Cell_rowId_fkey";

-- DropIndex
DROP INDEX "Cell_value_idx";

-- AlterTable
ALTER TABLE "Cell" ALTER COLUMN "value" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Table" ADD COLUMN     "rowCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Cell_rowId_columnId_key" ON "Cell"("rowId", "columnId");

-- AddForeignKey
ALTER TABLE "Cell" ADD CONSTRAINT "Cell_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "Column"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cell" ADD CONSTRAINT "Cell_rowId_fkey" FOREIGN KEY ("rowId") REFERENCES "Row"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
