-- Enforce mandatory TOTP and approval workflow for admins.

SET @add_is_seed_admin := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `admin_users` ADD COLUMN `isSeedAdmin` BOOLEAN NOT NULL DEFAULT false',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_users' AND COLUMN_NAME = 'isSeedAdmin'
);
PREPARE stmt_add_is_seed_admin FROM @add_is_seed_admin;
EXECUTE stmt_add_is_seed_admin;
DEALLOCATE PREPARE stmt_add_is_seed_admin;

SET @add_is_approved := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `admin_users` ADD COLUMN `isApproved` BOOLEAN NOT NULL DEFAULT false',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_users' AND COLUMN_NAME = 'isApproved'
);
PREPARE stmt_add_is_approved FROM @add_is_approved;
EXECUTE stmt_add_is_approved;
DEALLOCATE PREPARE stmt_add_is_approved;

SET @add_approved_by_id := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `admin_users` ADD COLUMN `approvedById` VARCHAR(191) NULL',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_users' AND COLUMN_NAME = 'approvedById'
);
PREPARE stmt_add_approved_by_id FROM @add_approved_by_id;
EXECUTE stmt_add_approved_by_id;
DEALLOCATE PREPARE stmt_add_approved_by_id;

SET @add_approved_at := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `admin_users` ADD COLUMN `approvedAt` DATETIME(3) NULL',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_users' AND COLUMN_NAME = 'approvedAt'
);
PREPARE stmt_add_approved_at FROM @add_approved_at;
EXECUTE stmt_add_approved_at;
DEALLOCATE PREPARE stmt_add_approved_at;

SET @add_totp_secret := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `admin_users` ADD COLUMN `totpSecret` VARCHAR(191) NULL',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_users' AND COLUMN_NAME = 'totpSecret'
);
PREPARE stmt_add_totp_secret FROM @add_totp_secret;
EXECUTE stmt_add_totp_secret;
DEALLOCATE PREPARE stmt_add_totp_secret;

SET @add_totp_configured_at := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `admin_users` ADD COLUMN `totpConfiguredAt` DATETIME(3) NULL',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_users' AND COLUMN_NAME = 'totpConfiguredAt'
);
PREPARE stmt_add_totp_configured_at FROM @add_totp_configured_at;
EXECUTE stmt_add_totp_configured_at;
DEALLOCATE PREPARE stmt_add_totp_configured_at;

SET @idx_is_approved := (
  SELECT IF(
    COUNT(*) = 0,
    'CREATE INDEX `admin_users_isApproved_idx` ON `admin_users`(`isApproved`)',
    'SELECT 1'
  )
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_users' AND INDEX_NAME = 'admin_users_isApproved_idx'
);
PREPARE stmt_idx_is_approved FROM @idx_is_approved;
EXECUTE stmt_idx_is_approved;
DEALLOCATE PREPARE stmt_idx_is_approved;

SET @idx_approved_by_id := (
  SELECT IF(
    COUNT(*) = 0,
    'CREATE INDEX `admin_users_approvedById_idx` ON `admin_users`(`approvedById`)',
    'SELECT 1'
  )
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_users' AND INDEX_NAME = 'admin_users_approvedById_idx'
);
PREPARE stmt_idx_approved_by_id FROM @idx_approved_by_id;
EXECUTE stmt_idx_approved_by_id;
DEALLOCATE PREPARE stmt_idx_approved_by_id;

-- Establish first/seed admin if not already marked.
SET @seed_admin_id := (
  SELECT id
  FROM admin_users
  WHERE isSeedAdmin = true
  ORDER BY createdAt ASC
  LIMIT 1
);
SET @seed_admin_id := COALESCE(
  @seed_admin_id,
  (SELECT id FROM admin_users ORDER BY createdAt ASC LIMIT 1)
);

UPDATE admin_users
SET
  isSeedAdmin = CASE WHEN id = @seed_admin_id THEN true ELSE isSeedAdmin END,
  isApproved = CASE WHEN id = @seed_admin_id THEN true ELSE isApproved END,
  approvedAt = CASE WHEN id = @seed_admin_id THEN COALESCE(approvedAt, CURRENT_TIMESTAMP(3)) ELSE approvedAt END
WHERE @seed_admin_id IS NOT NULL;

-- Existing admins become approved if they were pending.
UPDATE admin_users
SET
  isApproved = true,
  approvedAt = COALESCE(approvedAt, CURRENT_TIMESTAMP(3)),
  approvedById = COALESCE(approvedById, @seed_admin_id)
WHERE @seed_admin_id IS NOT NULL
  AND id <> @seed_admin_id
  AND isApproved = false;
