-- Safe migration: Add SafePay payment gateway columns and REFUNDED status.
-- This migration is idempotent — safe to run on databases with or without these changes.
-- It preserves ALL existing data in the appointment_payments table.

-- Step 1: Add safepayTracker column if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'appointment_payments' AND COLUMN_NAME = 'safepayTracker');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `appointment_payments` ADD COLUMN `safepayTracker` VARCHAR(255) NULL AFTER `paymentMethod`',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 2: Add safepayOrderRef column if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'appointment_payments' AND COLUMN_NAME = 'safepayOrderRef');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `appointment_payments` ADD COLUMN `safepayOrderRef` VARCHAR(255) NULL AFTER `safepayTracker`',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 3: Add safepayCheckoutUrl column if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'appointment_payments' AND COLUMN_NAME = 'safepayCheckoutUrl');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `appointment_payments` ADD COLUMN `safepayCheckoutUrl` TEXT NULL AFTER `safepayOrderRef`',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 4: Add REFUNDED to the AppointmentPaymentStatus enum if not already present.
-- MySQL ALTER COLUMN MODIFY is safe — it preserves existing data, just expands the allowed values.
ALTER TABLE `appointment_payments`
  MODIFY COLUMN `paymentStatus` ENUM('UNPAID', 'IN_REVIEW', 'PAID', 'PAID_TO_DOCTOR', 'DISPUTED', 'REFUNDED') NOT NULL DEFAULT 'UNPAID';

-- Step 5: Update default paymentMethod from 'manual_bank_transfer' to 'safepay'
ALTER TABLE `appointment_payments`
  ALTER COLUMN `paymentMethod` SET DEFAULT 'safepay';
