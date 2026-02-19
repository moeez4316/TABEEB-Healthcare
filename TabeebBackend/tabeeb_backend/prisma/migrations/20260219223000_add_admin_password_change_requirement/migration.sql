-- Enforce first-login password change for temporary admin credentials.
-- Idempotent to support mixed deployment states.

SET @add_must_change_password := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `admin_users` ADD COLUMN `mustChangePassword` BOOLEAN NOT NULL DEFAULT false',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_users' AND COLUMN_NAME = 'mustChangePassword'
);
PREPARE stmt_add_must_change_password FROM @add_must_change_password;
EXECUTE stmt_add_must_change_password;
DEALLOCATE PREPARE stmt_add_must_change_password;

SET @idx_must_change_password := (
  SELECT IF(
    COUNT(*) = 0,
    'CREATE INDEX `admin_users_mustChangePassword_idx` ON `admin_users`(`mustChangePassword`)',
    'SELECT 1'
  )
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_users' AND INDEX_NAME = 'admin_users_mustChangePassword_idx'
);
PREPARE stmt_idx_must_change_password FROM @idx_must_change_password;
EXECUTE stmt_idx_must_change_password;
DEALLOCATE PREPARE stmt_idx_must_change_password;