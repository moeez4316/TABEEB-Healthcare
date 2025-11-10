/*
  Warnings:

  - You are about to drop the column `consultationFees` on the `doctor` table. All the data in the column will be lost.
  - You are about to drop the column `dob` on the `patient` table. All the data in the column will be lost.
  - You are about to drop the column `medicalHistory` on the `patient` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `patient` table. All the data in the column will be lost.
  - You are about to drop the column `certificate` on the `verification` table. All the data in the column will be lost.
  - You are about to drop the column `cnic` on the `verification` table. All the data in the column will be lost.
  - Added the required column `firstName` to the `Doctor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `Doctor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Doctor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dateOfBirth` to the `Patient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `Patient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `Patient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Patient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cnicFrontUrl` to the `Verification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cnicNumber` to the `Verification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `degreeCertificateUrl` to the `Verification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pmdcCertificateUrl` to the `Verification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `verificationPhotoUrl` to the `Verification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `doctor` DROP COLUMN `consultationFees`,
    ADD COLUMN `addressCity` VARCHAR(100) NULL,
    ADD COLUMN `addressPostalCode` VARCHAR(10) NULL,
    ADD COLUMN `addressProvince` VARCHAR(100) NULL,
    ADD COLUMN `addressStreet` VARCHAR(255) NULL,
    ADD COLUMN `dateOfBirth` DATETIME(3) NULL,
    ADD COLUMN `firstName` VARCHAR(100) NOT NULL,
    ADD COLUMN `gender` VARCHAR(10) NULL,
    ADD COLUMN `language` VARCHAR(50) NOT NULL DEFAULT 'English',
    ADD COLUMN `lastName` VARCHAR(100) NOT NULL,
    ADD COLUMN `notificationsEmail` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `notificationsPush` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `notificationsSms` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `privacyMarketing` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `privacyShareData` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `profileImagePublicId` VARCHAR(255) NULL,
    ADD COLUMN `profileImageUrl` VARCHAR(500) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `experience` VARCHAR(50) NULL;

-- AlterTable
ALTER TABLE `patient` DROP COLUMN `dob`,
    DROP COLUMN `medicalHistory`,
    DROP COLUMN `name`,
    ADD COLUMN `addressCity` VARCHAR(100) NULL,
    ADD COLUMN `addressPostalCode` VARCHAR(10) NULL,
    ADD COLUMN `addressProvince` VARCHAR(100) NULL,
    ADD COLUMN `addressStreet` VARCHAR(255) NULL,
    ADD COLUMN `allergies` JSON NULL,
    ADD COLUMN `bloodType` VARCHAR(5) NULL,
    ADD COLUMN `cnic` VARCHAR(15) NULL,
    ADD COLUMN `dateOfBirth` DATETIME(3) NOT NULL,
    ADD COLUMN `emergencyContactName` VARCHAR(255) NULL,
    ADD COLUMN `emergencyContactPhone` VARCHAR(20) NULL,
    ADD COLUMN `emergencyContactRelationship` VARCHAR(100) NULL,
    ADD COLUMN `firstName` VARCHAR(100) NOT NULL,
    ADD COLUMN `height` VARCHAR(10) NULL,
    ADD COLUMN `language` VARCHAR(50) NOT NULL DEFAULT 'English',
    ADD COLUMN `lastName` VARCHAR(100) NOT NULL,
    ADD COLUMN `medicalConditions` JSON NULL,
    ADD COLUMN `medications` JSON NULL,
    ADD COLUMN `notificationsEmail` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `notificationsPush` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `notificationsSms` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `privacyMarketing` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `privacyShareData` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `profileImagePublicId` VARCHAR(255) NULL,
    ADD COLUMN `profileImageUrl` VARCHAR(500) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    ADD COLUMN `weight` VARCHAR(10) NULL;

-- AlterTable
ALTER TABLE `verification` DROP COLUMN `certificate`,
    DROP COLUMN `cnic`,
    ADD COLUMN `cnicBackUrl` TEXT NULL,
    ADD COLUMN `cnicFrontUrl` TEXT NOT NULL,
    ADD COLUMN `cnicNumber` VARCHAR(15) NOT NULL,
    ADD COLUMN `degreeCertificateUrl` TEXT NOT NULL,
    ADD COLUMN `degreeInstitution` VARCHAR(255) NULL,
    ADD COLUMN `graduationYear` VARCHAR(4) NULL,
    ADD COLUMN `pmdcCertificateUrl` TEXT NOT NULL,
    ADD COLUMN `pmdcRegistrationDate` DATETIME(3) NULL,
    ADD COLUMN `verificationPhotoUrl` TEXT NOT NULL;

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
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_doctorUid_fkey` FOREIGN KEY (`doctorUid`) REFERENCES `Doctor`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_patientUid_fkey` FOREIGN KEY (`patientUid`) REFERENCES `Patient`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescription_medicines` ADD CONSTRAINT `prescription_medicines_prescriptionId_fkey` FOREIGN KEY (`prescriptionId`) REFERENCES `prescriptions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
