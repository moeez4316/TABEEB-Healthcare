-- Safe migration: Remove legacy foreign key constraint and unique index on timeSlotId
ALTER TABLE `appointments` DROP FOREIGN KEY `appointments_timeSlotId_fkey`;

-- Drop unique index on timeSlotId if present
ALTER TABLE `appointments` DROP INDEX `appointments_timeSlotId_key`;

-- Make timeSlotId NULLable so inserts without timeSlotId succeed cleanly
ALTER TABLE `appointments` MODIFY COLUMN `timeSlotId` VARCHAR(255) NULL;
