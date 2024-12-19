/*
  Warnings:

  - You are about to drop the column `tableCount` on the `Base` table. All the data in the column will be lost.
  - You are about to drop the column `hiddenCols` on the `View` table. All the data in the column will be lost.
  - You are about to drop the column `sorts` on the `View` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Base" DROP COLUMN "tableCount";

-- AlterTable
ALTER TABLE "View" DROP COLUMN "hiddenCols",
DROP COLUMN "sorts",
ADD COLUMN     "columnVisibility" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "sorting" JSONB NOT NULL DEFAULT '[]',
ALTER COLUMN "filters" SET DEFAULT '[]';
