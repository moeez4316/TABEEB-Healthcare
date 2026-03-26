-- AlterTable
ALTER TABLE `appointments`
    ADD COLUMN `baseConsultationFees` DECIMAL(10, 2) NULL,
    ADD COLUMN `followUpDiscountPct` INTEGER NULL,
    ADD COLUMN `financialAidDiscountPct` INTEGER NULL;

-- CreateTable
CREATE TABLE `patient_financial_aid_requests` (
    `id` VARCHAR(191) NOT NULL,
    `patientUid` VARCHAR(255) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `requestedDiscountPercent` INTEGER NOT NULL DEFAULT 80,
    `adminComments` TEXT NULL,
    `rejectionReason` TEXT NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedAt` DATETIME(3) NULL,
    `reviewedBy` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `patient_financial_aid_requests_patientUid_key`(`patientUid`),
    INDEX `patient_financial_aid_requests_status_idx`(`status`),
    INDEX `patient_financial_aid_requests_submittedAt_idx`(`submittedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `patient_financial_aid_documents` (
    `id` VARCHAR(191) NOT NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `docType` VARCHAR(100) NULL,
    `fileUrl` TEXT NOT NULL,
    `publicId` VARCHAR(500) NOT NULL,
    `resourceType` VARCHAR(50) NOT NULL,
    `fileType` VARCHAR(100) NULL,
    `fileName` VARCHAR(500) NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `patient_financial_aid_documents_requestId_idx`(`requestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doctor_payout_methods` (
    `id` VARCHAR(191) NOT NULL,
    `doctorUid` VARCHAR(255) NOT NULL,
    `methodCode` VARCHAR(50) NOT NULL,
    `methodLabel` VARCHAR(100) NULL,
    `accountTitle` VARCHAR(255) NULL,
    `accountIdentifier` VARCHAR(255) NOT NULL,
    `bankName` VARCHAR(255) NULL,
    `iban` VARCHAR(50) NULL,
    `instructions` TEXT NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `doctor_payout_methods_doctorUid_idx`(`doctorUid`),
    INDEX `doctor_payout_methods_methodCode_idx`(`methodCode`),
    INDEX `doctor_payout_methods_isPrimary_idx`(`isPrimary`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `patient_financial_aid_requests` ADD CONSTRAINT `patient_financial_aid_requests_patientUid_fkey` FOREIGN KEY (`patientUid`) REFERENCES `patient`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `patient_financial_aid_documents` ADD CONSTRAINT `patient_financial_aid_documents_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `patient_financial_aid_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctor_payout_methods` ADD CONSTRAINT `doctor_payout_methods_doctorUid_fkey` FOREIGN KEY (`doctorUid`) REFERENCES `doctor`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE;
