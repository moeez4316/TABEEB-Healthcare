-- AlterTable
ALTER TABLE `prescription_medicines` ADD COLUMN `durationDays` INTEGER NULL,
    MODIFY `duration` VARCHAR(191) NOT NULL;
