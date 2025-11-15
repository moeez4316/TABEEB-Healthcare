/*
  Warnings:

  - You are about to drop the column `appointmentTime` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `timeSlotId` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the `time_slots` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `endTime` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `appointments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `appointments` DROP FOREIGN KEY `appointments_timeSlotId_fkey`;

-- DropForeignKey
ALTER TABLE `time_slots` DROP FOREIGN KEY `time_slots_availabilityId_fkey`;

-- DropIndex
DROP INDEX `appointments_timeSlotId_key` ON `appointments`;

-- AlterTable
ALTER TABLE `appointments` DROP COLUMN `appointmentTime`,
    DROP COLUMN `timeSlotId`,
    ADD COLUMN `endTime` VARCHAR(8) NOT NULL,
    ADD COLUMN `startTime` VARCHAR(8) NOT NULL,
    MODIFY `status` ENUM('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW') NOT NULL DEFAULT 'PENDING';

-- DropTable
DROP TABLE `time_slots`;

-- CreateIndex
CREATE INDEX `appointments_startTime_idx` ON `appointments`(`startTime`);
