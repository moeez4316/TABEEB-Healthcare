-- CreateTable
CREATE TABLE `doctor_availability` (
    `id` VARCHAR(191) NOT NULL,
    `doctorUid` VARCHAR(255) NOT NULL,
    `date` DATE NOT NULL,
    `startTime` VARCHAR(8) NOT NULL,
    `endTime` VARCHAR(8) NOT NULL,
    `slotDuration` INTEGER NOT NULL DEFAULT 30,
    `isAvailable` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `doctor_availability_doctorUid_idx`(`doctorUid`),
    INDEX `doctor_availability_date_idx`(`date`),
    UNIQUE INDEX `doctor_availability_doctorUid_date_key`(`doctorUid`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
CREATE TABLE `appointments` (
    `id` VARCHAR(191) NOT NULL,
    `doctorUid` VARCHAR(255) NOT NULL,
    `patientUid` VARCHAR(255) NOT NULL,
    `appointmentDate` DATE NOT NULL,
    `startTime` VARCHAR(8) NOT NULL,
    `endTime` VARCHAR(8) NOT NULL,
    `duration` INTEGER NOT NULL DEFAULT 30,
    `status` ENUM('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW') NOT NULL DEFAULT 'PENDING',
    `patientNotes` TEXT NULL,
    `doctorNotes` TEXT NULL,
    `cancelReason` TEXT NULL,
    `consultationFees` DECIMAL(10, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `completedAt` DATETIME(3) NULL,

    INDEX `appointments_doctorUid_idx`(`doctorUid`),
    INDEX `appointments_patientUid_idx`(`patientUid`),
    INDEX `appointments_appointmentDate_idx`(`appointmentDate`),
    INDEX `appointments_status_idx`(`status`),
    INDEX `appointments_startTime_idx`(`startTime`),
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
    `prescriptionStartDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `prescriptionEndDate` DATETIME(3) NULL,
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
    `durationDays` INTEGER NULL,
    `instructions` VARCHAR(191) NULL,
    `timing` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `prescription_medicines_prescriptionId_idx`(`prescriptionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `video_calls` (
    `id` VARCHAR(191) NOT NULL,
    `appointmentId` VARCHAR(191) NOT NULL,
    `roomName` VARCHAR(255) NOT NULL,
    `status` ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED', 'NO_SHOW') NOT NULL DEFAULT 'SCHEDULED',
    `startedAt` DATETIME(3) NULL,
    `endedAt` DATETIME(3) NULL,
    `duration` INTEGER NULL,
    `doctorJoinedAt` DATETIME(3) NULL,
    `patientJoinedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `video_calls_appointmentId_key`(`appointmentId`),
    INDEX `video_calls_appointmentId_idx`(`appointmentId`),
    INDEX `video_calls_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doctor` (
    `uid` VARCHAR(255) NOT NULL,
    `firstName` VARCHAR(100) NOT NULL,
    `lastName` VARCHAR(100) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(20) NULL,
    `dateOfBirth` DATETIME(3) NULL,
    `gender` VARCHAR(10) NULL,
    `profileImageUrl` VARCHAR(500) NULL,
    `profileImagePublicId` VARCHAR(255) NULL,
    `specialization` VARCHAR(100) NOT NULL,
    `qualification` TEXT NOT NULL,
    `experience` VARCHAR(50) NULL,
    `addressStreet` VARCHAR(255) NULL,
    `addressCity` VARCHAR(100) NULL,
    `addressProvince` VARCHAR(100) NULL,
    `addressPostalCode` VARCHAR(10) NULL,
    `language` VARCHAR(50) NOT NULL DEFAULT 'English',
    `notificationsEmail` BOOLEAN NOT NULL DEFAULT true,
    `notificationsSms` BOOLEAN NOT NULL DEFAULT true,
    `notificationsPush` BOOLEAN NOT NULL DEFAULT true,
    `privacyShareData` BOOLEAN NOT NULL DEFAULT false,
    `privacyMarketing` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Doctor_email_key`(`email`),
    UNIQUE INDEX `Doctor_phone_key`(`phone`),
    PRIMARY KEY (`uid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `patient` (
    `uid` VARCHAR(255) NOT NULL,
    `firstName` VARCHAR(100) NOT NULL,
    `lastName` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(20) NULL,
    `cnic` VARCHAR(15) NULL,
    `dateOfBirth` DATETIME(3) NOT NULL,
    `gender` VARCHAR(10) NOT NULL,
    `profileImageUrl` VARCHAR(500) NULL,
    `profileImagePublicId` VARCHAR(255) NULL,
    `bloodType` VARCHAR(5) NULL,
    `height` VARCHAR(10) NULL,
    `weight` VARCHAR(10) NULL,
    `allergies` JSON NULL,
    `medications` JSON NULL,
    `medicalConditions` JSON NULL,
    `emergencyContactName` VARCHAR(255) NULL,
    `emergencyContactRelationship` VARCHAR(100) NULL,
    `emergencyContactPhone` VARCHAR(20) NULL,
    `addressStreet` VARCHAR(255) NULL,
    `addressCity` VARCHAR(100) NULL,
    `addressProvince` VARCHAR(100) NULL,
    `addressPostalCode` VARCHAR(10) NULL,
    `language` VARCHAR(50) NOT NULL DEFAULT 'English',
    `notificationsEmail` BOOLEAN NOT NULL DEFAULT true,
    `notificationsSms` BOOLEAN NOT NULL DEFAULT true,
    `notificationsPush` BOOLEAN NOT NULL DEFAULT true,
    `privacyShareData` BOOLEAN NOT NULL DEFAULT false,
    `privacyMarketing` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Patient_email_key`(`email`),
    UNIQUE INDEX `Patient_phone_key`(`phone`),
    PRIMARY KEY (`uid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `uid` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`uid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verification` (
    `doctorUid` VARCHAR(255) NOT NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `cnicNumber` VARCHAR(15) NOT NULL,
    `pmdcNumber` VARCHAR(50) NOT NULL,
    `pmdcRegistrationDate` DATETIME(3) NULL,
    `graduationYear` VARCHAR(4) NULL,
    `degreeInstitution` VARCHAR(255) NULL,
    `cnicFrontUrl` TEXT NOT NULL,
    `cnicBackUrl` TEXT NULL,
    `verificationPhotoUrl` TEXT NOT NULL,
    `degreeCertificateUrl` TEXT NOT NULL,
    `pmdcCertificateUrl` TEXT NOT NULL,
    `adminComments` TEXT NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedAt` DATETIME(3) NULL,
    `reviewedBy` VARCHAR(255) NULL,

    PRIMARY KEY (`doctorUid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `doctor_availability` ADD CONSTRAINT `doctor_availability_doctorUid_fkey` FOREIGN KEY (`doctorUid`) REFERENCES `doctor`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctor_break_times` ADD CONSTRAINT `doctor_break_times_availabilityId_fkey` FOREIGN KEY (`availabilityId`) REFERENCES `doctor_availability`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_doctorUid_fkey` FOREIGN KEY (`doctorUid`) REFERENCES `doctor`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_patientUid_fkey` FOREIGN KEY (`patientUid`) REFERENCES `patient`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment_shared_documents` ADD CONSTRAINT `appointment_shared_documents_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_doctorUid_fkey` FOREIGN KEY (`doctorUid`) REFERENCES `doctor`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_patientUid_fkey` FOREIGN KEY (`patientUid`) REFERENCES `patient`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescription_medicines` ADD CONSTRAINT `prescription_medicines_prescriptionId_fkey` FOREIGN KEY (`prescriptionId`) REFERENCES `prescriptions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `video_calls` ADD CONSTRAINT `video_calls_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctor` ADD CONSTRAINT `Doctor_uid_fkey` FOREIGN KEY (`uid`) REFERENCES `user`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `patient` ADD CONSTRAINT `Patient_uid_fkey` FOREIGN KEY (`uid`) REFERENCES `user`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `verification` ADD CONSTRAINT `Verification_doctorUid_fkey` FOREIGN KEY (`doctorUid`) REFERENCES `doctor`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

