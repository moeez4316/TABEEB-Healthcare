-- Safe migration: Add paymentExpiresAt column to appointments table.
-- This column tracks the deadline for payment before auto-cancellation.
-- Idempotent — checks if column exists before adding.

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'appointments' AND COLUMN_NAME = 'paymentExpiresAt');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `appointments` ADD COLUMN `paymentExpiresAt` DATETIME(3) NULL AFTER `completedAt`',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
