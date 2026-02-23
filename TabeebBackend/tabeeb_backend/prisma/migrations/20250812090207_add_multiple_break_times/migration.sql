/*
  Safe migration (non-destructive):
  - Preserve legacy break columns on `doctor_availability`.
  - Backfill the new `doctor_break_times` table from existing data.
*/

-- CreateTable
CREATE TABLE `doctor_break_times` (
    `id` VARCHAR(191) NOT NULL,
    `availabilityId` VARCHAR(191) NOT NULL,
    `startTime` VARCHAR(8) NOT NULL,
    `endTime` VARCHAR(8) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `doctor_break_times_availabilityId_idx`(`availabilityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `appointment_shared_documents` (
    `id` VARCHAR(191) NOT NULL,
    `appointmentId` VARCHAR(255) NOT NULL,
    `documentId` VARCHAR(255) NOT NULL,
    `sharedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isVisible` BOOLEAN NOT NULL DEFAULT true,
    `sharedBy` VARCHAR(255) NOT NULL,

    INDEX `appointment_shared_documents_appointmentId_idx`(`appointmentId`),
    INDEX `appointment_shared_documents_documentId_idx`(`documentId`),
    INDEX `appointment_shared_documents_sharedBy_idx`(`sharedBy`),
    UNIQUE INDEX `appointment_shared_documents_appointmentId_documentId_key`(`appointmentId`, `documentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Backfill break times from legacy columns (if present)
INSERT INTO `doctor_break_times` (`id`, `availabilityId`, `startTime`, `endTime`, `createdAt`)
SELECT
  UUID(),
  da.id,
  da.breakStartTime,
  da.breakEndTime,
  NOW(3)
FROM `doctor_availability` da
WHERE da.breakStartTime IS NOT NULL
  AND da.breakEndTime IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM `doctor_break_times` dbt
    WHERE dbt.availabilityId = da.id
      AND dbt.startTime = da.breakStartTime
      AND dbt.endTime = da.breakEndTime
  );

-- AddForeignKey
ALTER TABLE `doctor_break_times` ADD CONSTRAINT `doctor_break_times_availabilityId_fkey` FOREIGN KEY (`availabilityId`) REFERENCES `doctor_availability`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment_shared_documents` ADD CONSTRAINT `appointment_shared_documents_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
