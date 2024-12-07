/*
  Warnings:

  - The primary key for the `Cell` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Column` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Row` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Table` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `View` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Cell" DROP CONSTRAINT "Cell_columnId_fkey";

-- DropForeignKey
ALTER TABLE "Cell" DROP CONSTRAINT "Cell_rowId_fkey";

-- DropForeignKey
ALTER TABLE "Column" DROP CONSTRAINT "Column_tableId_fkey";

-- DropForeignKey
ALTER TABLE "Row" DROP CONSTRAINT "Row_tableId_fkey";

-- DropForeignKey
ALTER TABLE "View" DROP CONSTRAINT "View_tableId_fkey";

-- AlterTable
ALTER TABLE "Cell" DROP CONSTRAINT "Cell_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "columnId" SET DATA TYPE TEXT,
ALTER COLUMN "rowId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Cell_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Cell_id_seq";

-- AlterTable
ALTER TABLE "Column" DROP CONSTRAINT "Column_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "tableId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Column_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Column_id_seq";

-- AlterTable
ALTER TABLE "Row" DROP CONSTRAINT "Row_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "tableId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Row_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Row_id_seq";

-- AlterTable
ALTER TABLE "Table" DROP CONSTRAINT "Table_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Table_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Table_id_seq";

-- AlterTable
ALTER TABLE "View" DROP CONSTRAINT "View_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "tableId" SET DATA TYPE TEXT,
ADD CONSTRAINT "View_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "View_id_seq";

-- AddForeignKey
ALTER TABLE "Column" ADD CONSTRAINT "Column_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Row" ADD CONSTRAINT "Row_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cell" ADD CONSTRAINT "Cell_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "Column"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cell" ADD CONSTRAINT "Cell_rowId_fkey" FOREIGN KEY ("rowId") REFERENCES "Row"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "View" ADD CONSTRAINT "View_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
