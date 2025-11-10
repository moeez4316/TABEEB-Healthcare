/*
  Warnings:

  - You are about to alter the column `duration` on the `prescription_medicines` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- AlterTable
ALTER TABLE `prescription_medicines` MODIFY `duration` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `prescriptions` ADD COLUMN `prescriptionEndDate` DATETIME(3) NULL,
    ADD COLUMN `prescriptionStartDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
