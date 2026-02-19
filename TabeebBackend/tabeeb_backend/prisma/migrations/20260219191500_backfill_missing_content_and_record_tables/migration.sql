-- Backfill core schema objects that are present in schema.prisma but missing from historical migrations.
-- This migration is intentionally idempotent for mixed environments.

SET @add_appointments_is_follow_up := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `appointments` ADD COLUMN `isFollowUp` BOOLEAN NOT NULL DEFAULT false',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'appointments'
    AND COLUMN_NAME = 'isFollowUp'
);
PREPARE stmt_add_appointments_is_follow_up FROM @add_appointments_is_follow_up;
EXECUTE stmt_add_appointments_is_follow_up;
DEALLOCATE PREPARE stmt_add_appointments_is_follow_up;

SET @add_appointments_original_id := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `appointments` ADD COLUMN `originalAppointmentId` VARCHAR(255) NULL',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'appointments'
    AND COLUMN_NAME = 'originalAppointmentId'
);
PREPARE stmt_add_appointments_original_id FROM @add_appointments_original_id;
EXECUTE stmt_add_appointments_original_id;
DEALLOCATE PREPARE stmt_add_appointments_original_id;

SET @doctor_email_nullable_sql := (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `doctor` MODIFY `email` VARCHAR(255) NULL',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'doctor'
    AND COLUMN_NAME = 'email'
    AND IS_NULLABLE = 'NO'
);
PREPARE stmt_doctor_email_nullable FROM @doctor_email_nullable_sql;
EXECUTE stmt_doctor_email_nullable;
DEALLOCATE PREPARE stmt_doctor_email_nullable;

SET @patient_email_nullable_sql := (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `patient` MODIFY `email` VARCHAR(255) NULL',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'patient'
    AND COLUMN_NAME = 'email'
    AND IS_NULLABLE = 'NO'
);
PREPARE stmt_patient_email_nullable FROM @patient_email_nullable_sql;
EXECUTE stmt_patient_email_nullable;
DEALLOCATE PREPARE stmt_patient_email_nullable;

CREATE TABLE IF NOT EXISTS `medical_records` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(255) NOT NULL,
  `fileUrl` TEXT NOT NULL,
  `fileType` VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
  `publicId` VARCHAR(500) NOT NULL,
  `resourceType` VARCHAR(50) NOT NULL,
  `fileName` VARCHAR(500) NULL,
  `tags` TEXT NULL,
  `notes` TEXT NULL,
  `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `medical_records_userId_idx`(`userId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reviews` (
  `id` VARCHAR(191) NOT NULL,
  `appointmentId` VARCHAR(191) NOT NULL,
  `rating` INTEGER NOT NULL,
  `comment` TEXT NULL,
  `isComplaint` BOOLEAN NOT NULL DEFAULT false,
  `adminNotes` TEXT NULL,
  `adminActionTaken` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `reviews_appointmentId_key`(`appointmentId`),
  INDEX `reviews_appointmentId_idx`(`appointmentId`),
  INDEX `reviews_isComplaint_idx`(`isComplaint`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `blogs` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(500) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `contentHtml` LONGTEXT NOT NULL,
  `excerpt` VARCHAR(500) NULL,
  `coverImageUrl` VARCHAR(500) NOT NULL,
  `coverImagePublicId` VARCHAR(255) NULL,
  `seoTitle` VARCHAR(70) NULL,
  `seoDescription` VARCHAR(160) NULL,
  `readTime` INTEGER NOT NULL DEFAULT 5,
  `viewCount` INTEGER NOT NULL DEFAULT 0,
  `authorType` ENUM('DOCTOR', 'EXTERNAL', 'ADMIN') NOT NULL,
  `doctorUid` VARCHAR(255) NULL,
  `externalAuthorName` VARCHAR(200) NULL,
  `externalAuthorBio` TEXT NULL,
  `authorImageUrl` VARCHAR(500) NULL,
  `authorImagePublicId` VARCHAR(255) NULL,
  `externalSourceName` VARCHAR(200) NULL,
  `externalSourceUrl` VARCHAR(500) NULL,
  `canonicalUrl` VARCHAR(500) NULL,
  `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `isFeatured` BOOLEAN NOT NULL DEFAULT false,
  `featuredOrder` INTEGER NULL,
  `publishedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `blogs_slug_key`(`slug`),
  INDEX `blogs_status_idx`(`status`),
  INDEX `blogs_doctorUid_idx`(`doctorUid`),
  INDEX `blogs_publishedAt_idx`(`publishedAt`),
  INDEX `blogs_isFeatured_idx`(`isFeatured`),
  INDEX `blogs_authorType_idx`(`authorType`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `blog_tags` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(110) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `blog_tags_name_key`(`name`),
  UNIQUE INDEX `blog_tags_slug_key`(`slug`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` VARCHAR(191) NOT NULL,
  `type` ENUM('CONTACT', 'SUPPORT', 'FEEDBACK', 'INBOUND') NOT NULL DEFAULT 'CONTACT',
  `status` ENUM('NEW', 'READ', 'IN_PROGRESS', 'REPLIED', 'CLOSED') NOT NULL DEFAULT 'NEW',
  `fromEmail` VARCHAR(255) NOT NULL,
  `fromName` VARCHAR(255) NULL,
  `subject` VARCHAR(500) NOT NULL,
  `message` TEXT NOT NULL,
  `htmlContent` LONGTEXT NULL,
  `adminNotes` TEXT NULL,
  `adminReply` TEXT NULL,
  `repliedAt` DATETIME(3) NULL,
  `repliedBy` VARCHAR(255) NULL,
  `attachments` JSON NULL,
  `metadata` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `contact_messages_type_idx`(`type`),
  INDEX `contact_messages_status_idx`(`status`),
  INDEX `contact_messages_createdAt_idx`(`createdAt`),
  INDEX `contact_messages_fromEmail_idx`(`fromEmail`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `pmdc_lookup_cache` (
  `id` VARCHAR(191) NOT NULL,
  `pmdcNumber` VARCHAR(50) NOT NULL,
  `doctorName` VARCHAR(255) NULL,
  `fatherName` VARCHAR(255) NULL,
  `registrationDate` VARCHAR(100) NULL,
  `qualification` VARCHAR(500) NULL,
  `institution` VARCHAR(500) NULL,
  `registrationStatus` VARCHAR(100) NULL,
  `address` TEXT NULL,
  `rawData` JSON NULL,
  `source` VARCHAR(50) NOT NULL DEFAULT 'pmdc_website',
  `found` BOOLEAN NOT NULL DEFAULT false,
  `errorMessage` TEXT NULL,
  `fetchedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expiresAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `pmdc_lookup_cache_pmdcNumber_key`(`pmdcNumber`),
  INDEX `pmdc_lookup_cache_pmdcNumber_idx`(`pmdcNumber`),
  INDEX `pmdc_lookup_cache_fetchedAt_idx`(`fetchedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `_BlogToBlogTag` (
  `A` VARCHAR(191) NOT NULL,
  `B` VARCHAR(191) NOT NULL,

  UNIQUE INDEX `_BlogToBlogTag_AB_unique`(`A`, `B`),
  INDEX `_BlogToBlogTag_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @doctor_phone_unique_sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'doctor'
        AND INDEX_NAME = 'Doctor_phone_key') = 0
    AND (
      SELECT COUNT(*)
      FROM (
        SELECT `phone`
        FROM `doctor`
        WHERE `phone` IS NOT NULL AND `phone` <> ''
        GROUP BY `phone`
        HAVING COUNT(*) > 1
      ) duplicates
    ) = 0,
    'CREATE UNIQUE INDEX `Doctor_phone_key` ON `doctor`(`phone`)',
    'SELECT 1'
  )
);
PREPARE stmt_doctor_phone_unique FROM @doctor_phone_unique_sql;
EXECUTE stmt_doctor_phone_unique;
DEALLOCATE PREPARE stmt_doctor_phone_unique;

SET @patient_phone_unique_sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'patient'
        AND INDEX_NAME = 'Patient_phone_key') = 0
    AND (
      SELECT COUNT(*)
      FROM (
        SELECT `phone`
        FROM `patient`
        WHERE `phone` IS NOT NULL AND `phone` <> ''
        GROUP BY `phone`
        HAVING COUNT(*) > 1
      ) duplicates
    ) = 0,
    'CREATE UNIQUE INDEX `Patient_phone_key` ON `patient`(`phone`)',
    'SELECT 1'
  )
);
PREPARE stmt_patient_phone_unique FROM @patient_phone_unique_sql;
EXECUTE stmt_patient_phone_unique;
DEALLOCATE PREPARE stmt_patient_phone_unique;

SET @reviews_fk_sql := IF(
  (
    SELECT COUNT(*)
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND CONSTRAINT_NAME = 'reviews_appointmentId_fkey'
  ) = 0,
  'ALTER TABLE `reviews` ADD CONSTRAINT `reviews_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt_reviews_fk FROM @reviews_fk_sql;
EXECUTE stmt_reviews_fk;
DEALLOCATE PREPARE stmt_reviews_fk;

SET @blogs_fk_sql := IF(
  (
    SELECT COUNT(*)
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND CONSTRAINT_NAME = 'blogs_doctorUid_fkey'
  ) = 0,
  'ALTER TABLE `blogs` ADD CONSTRAINT `blogs_doctorUid_fkey` FOREIGN KEY (`doctorUid`) REFERENCES `doctor`(`uid`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt_blogs_fk FROM @blogs_fk_sql;
EXECUTE stmt_blogs_fk;
DEALLOCATE PREPARE stmt_blogs_fk;

SET @blog_tag_a_fk_sql := IF(
  (
    SELECT COUNT(*)
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND CONSTRAINT_NAME = '_BlogToBlogTag_A_fkey'
  ) = 0,
  'ALTER TABLE `_BlogToBlogTag` ADD CONSTRAINT `_BlogToBlogTag_A_fkey` FOREIGN KEY (`A`) REFERENCES `blogs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt_blog_tag_a_fk FROM @blog_tag_a_fk_sql;
EXECUTE stmt_blog_tag_a_fk;
DEALLOCATE PREPARE stmt_blog_tag_a_fk;

SET @blog_tag_b_fk_sql := IF(
  (
    SELECT COUNT(*)
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND CONSTRAINT_NAME = '_BlogToBlogTag_B_fkey'
  ) = 0,
  'ALTER TABLE `_BlogToBlogTag` ADD CONSTRAINT `_BlogToBlogTag_B_fkey` FOREIGN KEY (`B`) REFERENCES `blog_tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt_blog_tag_b_fk FROM @blog_tag_b_fk_sql;
EXECUTE stmt_blog_tag_b_fk;
DEALLOCATE PREPARE stmt_blog_tag_b_fk;
