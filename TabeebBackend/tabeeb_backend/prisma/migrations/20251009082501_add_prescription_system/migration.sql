/*
  Safe migration (non-destructive):
  - Preserve legacy columns.
  - Backfill required fields from existing data.
*/
-- AlterTable (doctor)
ALTER TABLE `doctor`
    ADD COLUMN `addressCity` VARCHAR(100) NULL,
    ADD COLUMN `addressPostalCode` VARCHAR(10) NULL,
    ADD COLUMN `addressProvince` VARCHAR(100) NULL,
    ADD COLUMN `addressStreet` VARCHAR(255) NULL,
    ADD COLUMN `dateOfBirth` DATETIME(3) NULL,
    ADD COLUMN `firstName` VARCHAR(100) NULL,
    ADD COLUMN `gender` VARCHAR(10) NULL,
    ADD COLUMN `language` VARCHAR(50) NOT NULL DEFAULT 'English',
    ADD COLUMN `lastName` VARCHAR(100) NULL,
    ADD COLUMN `notificationsEmail` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `notificationsPush` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `notificationsSms` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `privacyMarketing` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `privacyShareData` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `profileImagePublicId` VARCHAR(255) NULL,
    ADD COLUMN `profileImageUrl` VARCHAR(500) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NULL,
    MODIFY `experience` VARCHAR(50) NULL;

-- Backfill doctor required fields
UPDATE `doctor`
SET
  firstName = COALESCE(firstName, NULLIF(TRIM(SUBSTRING_INDEX(name, ' ', 1)), ''), 'Unknown'),
  lastName = COALESCE(
    lastName,
    NULLIF(TRIM(SUBSTRING(name, LENGTH(SUBSTRING_INDEX(name, ' ', 1)) + 2)), ''),
    'Unknown'
  ),
  updatedAt = COALESCE(updatedAt, createdAt, NOW(3))
WHERE firstName IS NULL OR lastName IS NULL OR updatedAt IS NULL;

-- Enforce NOT NULL after backfill
ALTER TABLE `doctor`
    MODIFY `firstName` VARCHAR(100) NOT NULL,
    MODIFY `lastName` VARCHAR(100) NOT NULL,
    MODIFY `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable (patient)
ALTER TABLE `patient`
    ADD COLUMN `addressCity` VARCHAR(100) NULL,
    ADD COLUMN `addressPostalCode` VARCHAR(10) NULL,
    ADD COLUMN `addressProvince` VARCHAR(100) NULL,
    ADD COLUMN `addressStreet` VARCHAR(255) NULL,
    ADD COLUMN `allergies` JSON NULL,
    ADD COLUMN `bloodType` VARCHAR(5) NULL,
    ADD COLUMN `cnic` VARCHAR(15) NULL,
    ADD COLUMN `dateOfBirth` DATETIME(3) NULL,
    ADD COLUMN `emergencyContactName` VARCHAR(255) NULL,
    ADD COLUMN `emergencyContactPhone` VARCHAR(20) NULL,
    ADD COLUMN `emergencyContactRelationship` VARCHAR(100) NULL,
    ADD COLUMN `firstName` VARCHAR(100) NULL,
    ADD COLUMN `height` VARCHAR(10) NULL,
    ADD COLUMN `language` VARCHAR(50) NOT NULL DEFAULT 'English',
    ADD COLUMN `lastName` VARCHAR(100) NULL,
    ADD COLUMN `medicalConditions` JSON NULL,
    ADD COLUMN `medications` JSON NULL,
    ADD COLUMN `notificationsEmail` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `notificationsPush` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `notificationsSms` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `privacyMarketing` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `privacyShareData` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `profileImagePublicId` VARCHAR(255) NULL,
    ADD COLUMN `profileImageUrl` VARCHAR(500) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NULL,
    ADD COLUMN `weight` VARCHAR(10) NULL;

-- Backfill patient required fields
UPDATE `patient`
SET
  firstName = COALESCE(firstName, NULLIF(TRIM(SUBSTRING_INDEX(name, ' ', 1)), ''), 'Unknown'),
  lastName = COALESCE(
    lastName,
    NULLIF(TRIM(SUBSTRING(name, LENGTH(SUBSTRING_INDEX(name, ' ', 1)) + 2)), ''),
    'Unknown'
  ),
  dateOfBirth = COALESCE(dateOfBirth, dob, '1970-01-01'),
  updatedAt = COALESCE(updatedAt, createdAt, NOW(3))
WHERE firstName IS NULL OR lastName IS NULL OR dateOfBirth IS NULL OR updatedAt IS NULL;

-- Enforce NOT NULL after backfill
ALTER TABLE `patient`
    MODIFY `dateOfBirth` DATETIME(3) NOT NULL,
    MODIFY `firstName` VARCHAR(100) NOT NULL,
    MODIFY `lastName` VARCHAR(100) NOT NULL,
    MODIFY `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable (verification)
ALTER TABLE `verification`
    ADD COLUMN `cnicBackUrl` TEXT NULL,
    ADD COLUMN `cnicFrontUrl` TEXT NULL,
    ADD COLUMN `cnicNumber` VARCHAR(15) NULL,
    ADD COLUMN `degreeCertificateUrl` TEXT NULL,
    ADD COLUMN `degreeInstitution` VARCHAR(255) NULL,
    ADD COLUMN `graduationYear` VARCHAR(4) NULL,
    ADD COLUMN `pmdcCertificateUrl` TEXT NULL,
    ADD COLUMN `pmdcRegistrationDate` DATETIME(3) NULL,
    ADD COLUMN `verificationPhotoUrl` TEXT NULL;

-- Backfill verification required fields
UPDATE `verification`
SET
  cnicNumber = COALESCE(cnicNumber, LEFT(cnic, 15)),
  cnicFrontUrl = COALESCE(cnicFrontUrl, ''),
  verificationPhotoUrl = COALESCE(verificationPhotoUrl, ''),
  degreeCertificateUrl = COALESCE(degreeCertificateUrl, certificate, ''),
  pmdcCertificateUrl = COALESCE(pmdcCertificateUrl, certificate, '')
WHERE cnicNumber IS NULL
   OR cnicFrontUrl IS NULL
   OR verificationPhotoUrl IS NULL
   OR degreeCertificateUrl IS NULL
   OR pmdcCertificateUrl IS NULL;

-- Enforce NOT NULL after backfill
ALTER TABLE `verification`
    MODIFY `cnicFrontUrl` TEXT NOT NULL,
    MODIFY `cnicNumber` VARCHAR(15) NOT NULL,
    MODIFY `degreeCertificateUrl` TEXT NOT NULL,
    MODIFY `pmdcCertificateUrl` TEXT NOT NULL,
    MODIFY `verificationPhotoUrl` TEXT NOT NULL;

-- CreateTable
CREATE TABLE `prescriptions` (
    `id` VARCHAR(191) NOT NULL,
    `prescriptionId` VARCHAR(191) NOT NULL,
    `doctorUid` VARCHAR(255) NOT NULL,
    `patientUid` VARCHAR(255) NOT NULL,
    `appointmentId` VARCHAR(191) NULL,
    `patientName` VARCHAR(191) NOT NULL,
    `patientAge` INTEGER NOT NULL,
    `patientGender` VARCHAR(191) NOT NULL,
    `diagnosis` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `instructions` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `prescriptions_prescriptionId_key`(`prescriptionId`),
    INDEX `prescriptions_doctorUid_idx`(`doctorUid`),
    INDEX `prescriptions_patientUid_idx`(`patientUid`),
    INDEX `prescriptions_appointmentId_idx`(`appointmentId`),
    INDEX `prescriptions_prescriptionId_idx`(`prescriptionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prescription_medicines` (
    `id` VARCHAR(191) NOT NULL,
    `prescriptionId` VARCHAR(191) NOT NULL,
    `medicineName` VARCHAR(191) NOT NULL,
    `dosage` VARCHAR(191) NOT NULL,
    `frequency` VARCHAR(191) NOT NULL,
    `duration` VARCHAR(191) NOT NULL,
    `instructions` VARCHAR(191) NULL,
    `timing` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `prescription_medicines_prescriptionId_idx`(`prescriptionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_doctorUid_fkey` FOREIGN KEY (`doctorUid`) REFERENCES `doctor`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_patientUid_fkey` FOREIGN KEY (`patientUid`) REFERENCES `patient`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescription_medicines` ADD CONSTRAINT `prescription_medicines_prescriptionId_fkey` FOREIGN KEY (`prescriptionId`) REFERENCES `prescriptions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
