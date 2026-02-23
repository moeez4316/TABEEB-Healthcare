/*
  Safe migration (non-destructive):
  - Preserve legacy `appointmentTime`/`timeSlotId` and `time_slots` data.
  - Add `startTime`/`endTime` and backfill from existing data.
*/

-- AlterTable (non-destructive)
ALTER TABLE `appointments`
    ADD COLUMN `startTime` VARCHAR(8) NULL,
    ADD COLUMN `endTime` VARCHAR(8) NULL,
    MODIFY `status` ENUM('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW') NOT NULL DEFAULT 'PENDING';

-- Backfill start/end times from existing data
UPDATE `appointments` a
LEFT JOIN `time_slots` t ON t.id = a.timeSlotId
SET
  a.startTime = COALESCE(a.startTime, t.startTime, a.appointmentTime),
  a.endTime = COALESCE(
    a.endTime,
    t.endTime,
    CASE
      WHEN a.appointmentTime IS NOT NULL THEN
        DATE_FORMAT(
          ADDTIME(
            CONCAT('2000-01-01 ', a.appointmentTime),
            SEC_TO_TIME(COALESCE(a.duration, 0) * 60)
          ),
          '%H:%i:%s'
        )
      ELSE NULL
    END
  )
WHERE a.startTime IS NULL OR a.endTime IS NULL;

-- Ensure non-null values for required columns
UPDATE `appointments`
SET
  startTime = COALESCE(startTime, '00:00:00'),
  endTime = COALESCE(endTime, '00:00:00')
WHERE startTime IS NULL OR endTime IS NULL;

-- Enforce NOT NULL after backfill
ALTER TABLE `appointments`
    MODIFY `startTime` VARCHAR(8) NOT NULL,
    MODIFY `endTime` VARCHAR(8) NOT NULL;

-- CreateIndex
CREATE INDEX `appointments_startTime_idx` ON `appointments`(`startTime`);
