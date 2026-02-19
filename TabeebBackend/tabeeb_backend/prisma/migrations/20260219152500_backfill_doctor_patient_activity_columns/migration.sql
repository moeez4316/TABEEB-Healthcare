-- Backfill missing doctor/patient account activity columns.
-- Some historical migrations never added these fields, but current Prisma schema expects them.

SET @doctor_is_active_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'doctor'
    AND COLUMN_NAME = 'isActive'
);
SET @doctor_is_active_sql := IF(
  @doctor_is_active_exists = 0,
  'ALTER TABLE `doctor` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true',
  'SELECT 1'
);
PREPARE doctor_is_active_stmt FROM @doctor_is_active_sql;
EXECUTE doctor_is_active_stmt;
DEALLOCATE PREPARE doctor_is_active_stmt;

SET @doctor_followup_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'doctor'
    AND COLUMN_NAME = 'followUpPercentage'
);
SET @doctor_followup_sql := IF(
  @doctor_followup_exists = 0,
  'ALTER TABLE `doctor` ADD COLUMN `followUpPercentage` INTEGER NULL DEFAULT 50',
  'SELECT 1'
);
PREPARE doctor_followup_stmt FROM @doctor_followup_sql;
EXECUTE doctor_followup_stmt;
DEALLOCATE PREPARE doctor_followup_stmt;

SET @doctor_avg_rating_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'doctor'
    AND COLUMN_NAME = 'averageRating'
);
SET @doctor_avg_rating_sql := IF(
  @doctor_avg_rating_exists = 0,
  'ALTER TABLE `doctor` ADD COLUMN `averageRating` DOUBLE NULL DEFAULT 0.0',
  'SELECT 1'
);
PREPARE doctor_avg_rating_stmt FROM @doctor_avg_rating_sql;
EXECUTE doctor_avg_rating_stmt;
DEALLOCATE PREPARE doctor_avg_rating_stmt;

SET @doctor_total_reviews_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'doctor'
    AND COLUMN_NAME = 'totalReviews'
);
SET @doctor_total_reviews_sql := IF(
  @doctor_total_reviews_exists = 0,
  'ALTER TABLE `doctor` ADD COLUMN `totalReviews` INTEGER NOT NULL DEFAULT 0',
  'SELECT 1'
);
PREPARE doctor_total_reviews_stmt FROM @doctor_total_reviews_sql;
EXECUTE doctor_total_reviews_stmt;
DEALLOCATE PREPARE doctor_total_reviews_stmt;

SET @patient_is_active_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'patient'
    AND COLUMN_NAME = 'isActive'
);
SET @patient_is_active_sql := IF(
  @patient_is_active_exists = 0,
  'ALTER TABLE `patient` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true',
  'SELECT 1'
);
PREPARE patient_is_active_stmt FROM @patient_is_active_sql;
EXECUTE patient_is_active_stmt;
DEALLOCATE PREPARE patient_is_active_stmt;
