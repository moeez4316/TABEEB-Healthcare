-- AlterTable
ALTER TABLE `doctor` ADD COLUMN `consultationFees` DECIMAL(10, 2) NULL;

-- CreateTable
CREATE TABLE `doctor_availability` (
    `id` VARCHAR(191) NOT NULL,
    `doctorUid` VARCHAR(255) NOT NULL,
    `date` DATE NOT NULL,
    `startTime` VARCHAR(8) NOT NULL,
    `endTime` VARCHAR(8) NOT NULL,
    `slotDuration` INTEGER NOT NULL DEFAULT 30,
    `isAvailable` BOOLEAN NOT NULL DEFAULT true,
    `breakStartTime` VARCHAR(8) NULL,
    `breakEndTime` VARCHAR(8) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `doctor_availability_doctorUid_idx`(`doctorUid`),
    INDEX `doctor_availability_date_idx`(`date`),
    UNIQUE INDEX `doctor_availability_doctorUid_date_key`(`doctorUid`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `time_slots` (
    `id` VARCHAR(191) NOT NULL,
    `availabilityId` VARCHAR(255) NOT NULL,
    `startTime` VARCHAR(8) NOT NULL,
    `endTime` VARCHAR(8) NOT NULL,
    `isBooked` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `time_slots_availabilityId_idx`(`availabilityId`),
    INDEX `time_slots_isBooked_idx`(`isBooked`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `appointments` (
    `id` VARCHAR(191) NOT NULL,
    `doctorUid` VARCHAR(255) NOT NULL,
    `patientUid` VARCHAR(255) NOT NULL,
    `timeSlotId` VARCHAR(255) NOT NULL,
    `appointmentDate` DATE NOT NULL,
    `appointmentTime` VARCHAR(8) NOT NULL,
    `duration` INTEGER NOT NULL DEFAULT 30,
    `status` ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW') NOT NULL DEFAULT 'PENDING',
    `patientNotes` TEXT NULL,
    `doctorNotes` TEXT NULL,
    `cancelReason` TEXT NULL,
    `consultationFees` DECIMAL(10, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `completedAt` DATETIME(3) NULL,

    UNIQUE INDEX `appointments_timeSlotId_key`(`timeSlotId`),
    INDEX `appointments_doctorUid_idx`(`doctorUid`),
    INDEX `appointments_patientUid_idx`(`patientUid`),
    INDEX `appointments_appointmentDate_idx`(`appointmentDate`),
    INDEX `appointments_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `doctor_availability` ADD CONSTRAINT `doctor_availability_doctorUid_fkey` FOREIGN KEY (`doctorUid`) REFERENCES `Doctor`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `time_slots` ADD CONSTRAINT `time_slots_availabilityId_fkey` FOREIGN KEY (`availabilityId`) REFERENCES `doctor_availability`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_doctorUid_fkey` FOREIGN KEY (`doctorUid`) REFERENCES `Doctor`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_patientUid_fkey` FOREIGN KEY (`patientUid`) REFERENCES `Patient`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_timeSlotId_fkey` FOREIGN KEY (`timeSlotId`) REFERENCES `time_slots`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
