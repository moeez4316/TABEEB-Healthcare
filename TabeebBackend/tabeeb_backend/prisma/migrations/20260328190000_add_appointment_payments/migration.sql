-- Add appointment payments table for manual payment proof and admin payout tracking.

CREATE TABLE IF NOT EXISTS `appointment_payments` (
  `id` VARCHAR(191) NOT NULL,
  `appointmentId` VARCHAR(255) NOT NULL,
  `paymentStatus` ENUM('UNPAID', 'IN_REVIEW', 'PAID', 'PAID_TO_DOCTOR', 'DISPUTED') NOT NULL DEFAULT 'UNPAID',
  `paymentMethod` VARCHAR(50) NOT NULL DEFAULT 'manual_bank_transfer',
  `proofUrl` TEXT NULL,
  `proofUploadedAt` DATETIME(3) NULL,
  `patientReference` VARCHAR(255) NULL,
  `reviewedByAdminId` VARCHAR(255) NULL,
  `reviewedAt` DATETIME(3) NULL,
  `reviewNotes` TEXT NULL,
  `payoutReference` VARCHAR(255) NULL,
  `payoutSentByAdminId` VARCHAR(255) NULL,
  `payoutSentAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `appointment_payments_appointmentId_key`(`appointmentId`),
  INDEX `appointment_payments_paymentStatus_idx`(`paymentStatus`),
  INDEX `appointment_payments_proofUploadedAt_idx`(`proofUploadedAt`),
  INDEX `appointment_payments_reviewedAt_idx`(`reviewedAt`),
  INDEX `appointment_payments_payoutSentAt_idx`(`payoutSentAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `appointment_payments`
  ADD CONSTRAINT `appointment_payments_appointmentId_fkey`
  FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
