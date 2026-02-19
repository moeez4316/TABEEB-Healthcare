-- Backfill missing weekly availability tables for environments where they were never migrated.
CREATE TABLE IF NOT EXISTS `weekly_availability_template` (
  `id` VARCHAR(191) NOT NULL,
  `doctorUid` VARCHAR(255) NOT NULL,
  `dayOfWeek` INTEGER NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT false,
  `startTime` VARCHAR(8) NOT NULL,
  `endTime` VARCHAR(8) NOT NULL,
  `slotDuration` INTEGER NOT NULL DEFAULT 30,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `weekly_availability_template_doctorUid_idx`(`doctorUid`),
  UNIQUE INDEX `weekly_availability_template_doctorUid_dayOfWeek_key`(`doctorUid`, `dayOfWeek`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `weekly_template_break_times` (
  `id` VARCHAR(191) NOT NULL,
  `templateId` VARCHAR(191) NOT NULL,
  `startTime` VARCHAR(8) NOT NULL,
  `endTime` VARCHAR(8) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `weekly_template_break_times_templateId_idx`(`templateId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Foreign keys are added separately and only if absent.
SET @weekly_fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND CONSTRAINT_NAME = 'weekly_availability_template_doctorUid_fkey'
);
SET @weekly_fk_sql := IF(
  @weekly_fk_exists = 0,
  'ALTER TABLE `weekly_availability_template` ADD CONSTRAINT `weekly_availability_template_doctorUid_fkey` FOREIGN KEY (`doctorUid`) REFERENCES `doctor`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE weekly_fk_stmt FROM @weekly_fk_sql;
EXECUTE weekly_fk_stmt;
DEALLOCATE PREPARE weekly_fk_stmt;

SET @break_fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND CONSTRAINT_NAME = 'weekly_template_break_times_templateId_fkey'
);
SET @break_fk_sql := IF(
  @break_fk_exists = 0,
  'ALTER TABLE `weekly_template_break_times` ADD CONSTRAINT `weekly_template_break_times_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `weekly_availability_template`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE break_fk_stmt FROM @break_fk_sql;
EXECUTE break_fk_stmt;
DEALLOCATE PREPARE break_fk_stmt;
