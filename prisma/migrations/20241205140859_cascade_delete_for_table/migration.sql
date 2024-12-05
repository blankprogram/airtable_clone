-- DropForeignKey
ALTER TABLE "Table" DROP CONSTRAINT "Table_baseId_fkey";

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "Base"("id") ON DELETE CASCADE ON UPDATE CASCADE;
