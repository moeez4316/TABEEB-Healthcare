-- Ensure OTP table exists, then extend enum for admin login 2FA
CREATE TABLE IF NOT EXISTS `otp_codes` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `code` VARCHAR(6) NOT NULL,
  `type` ENUM('EMAIL_VERIFY', 'PASSWORD_RESET', 'ADMIN_LOGIN') NOT NULL,
  `used` BOOLEAN NOT NULL DEFAULT false,
  `expiresAt` DATETIME(3) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `otp_codes_email_type_idx`(`email`, `type`),
  INDEX `otp_codes_expiresAt_idx`(`expiresAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `otp_codes`
  MODIFY `type` ENUM('EMAIL_VERIFY', 'PASSWORD_RESET', 'ADMIN_LOGIN') NOT NULL;

-- Admin identity and RBAC
CREATE TABLE `admin_users` (
  `id` VARCHAR(191) NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `displayName` VARCHAR(200) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `passwordHash` VARCHAR(255) NOT NULL,
  `role` ENUM('SUPER_ADMIN', 'VERIFICATION_TEAM', 'SUPPORT_TEAM', 'OPERATIONS_TEAM', 'CONTENT_TEAM') NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `isBlocked` BOOLEAN NOT NULL DEFAULT false,
  `blockedAt` DATETIME(3) NULL,
  `blockedReason` TEXT NULL,
  `twoFactorEnabled` BOOLEAN NOT NULL DEFAULT true,
  `twoFactorEnforced` BOOLEAN NOT NULL DEFAULT true,
  `mailboxStatus` ENUM('ACTIVE', 'SUSPENDED', 'FORWARDED') NOT NULL DEFAULT 'ACTIVE',
  `mailboxForwardTo` VARCHAR(255) NULL,
  `customPermissions` JSON NULL,
  `lastLoginAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `admin_users_username_key`(`username`),
  UNIQUE INDEX `admin_users_email_key`(`email`),
  INDEX `admin_users_role_idx`(`role`),
  INDEX `admin_users_isBlocked_idx`(`isBlocked`),
  INDEX `admin_users_isActive_idx`(`isActive`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `admin_sessions` (
  `id` VARCHAR(191) NOT NULL,
  `adminUserId` VARCHAR(191) NOT NULL,
  `jwtId` VARCHAR(191) NOT NULL,
  `ipAddress` VARCHAR(64) NULL,
  `userAgent` VARCHAR(500) NULL,
  `requiresTwoFactor` BOOLEAN NOT NULL DEFAULT true,
  `twoFactorVerifiedAt` DATETIME(3) NULL,
  `isRevoked` BOOLEAN NOT NULL DEFAULT false,
  `revokedAt` DATETIME(3) NULL,
  `revokedReason` VARCHAR(255) NULL,
  `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expiresAt` DATETIME(3) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `admin_sessions_jwtId_key`(`jwtId`),
  INDEX `admin_sessions_adminUserId_idx`(`adminUserId`),
  INDEX `admin_sessions_jwtId_idx`(`jwtId`),
  INDEX `admin_sessions_isRevoked_idx`(`isRevoked`),
  INDEX `admin_sessions_expiresAt_idx`(`expiresAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `admin_internal_messages` (
  `id` VARCHAR(191) NOT NULL,
  `type` ENUM('DIRECT', 'GROUP', 'SYSTEM_ANNOUNCEMENT', 'BROADCAST') NOT NULL DEFAULT 'DIRECT',
  `subject` VARCHAR(300) NULL,
  `body` LONGTEXT NOT NULL,
  `senderId` VARCHAR(191) NOT NULL,
  `recipientRole` ENUM('SUPER_ADMIN', 'VERIFICATION_TEAM', 'SUPPORT_TEAM', 'OPERATIONS_TEAM', 'CONTENT_TEAM') NULL,
  `attachments` JSON NULL,
  `isAuditRequired` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `admin_internal_messages_senderId_idx`(`senderId`),
  INDEX `admin_internal_messages_recipientRole_idx`(`recipientRole`),
  INDEX `admin_internal_messages_type_idx`(`type`),
  INDEX `admin_internal_messages_createdAt_idx`(`createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `admin_internal_message_recipients` (
  `id` VARCHAR(191) NOT NULL,
  `messageId` VARCHAR(191) NOT NULL,
  `recipientId` VARCHAR(191) NOT NULL,
  `readAt` DATETIME(3) NULL,
  `isArchived` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `admin_internal_message_recipients_messageId_recipientId_key`(`messageId`, `recipientId`),
  INDEX `admin_internal_message_recipients_recipientId_readAt_idx`(`recipientId`, `readAt`),
  INDEX `admin_internal_message_recipients_messageId_idx`(`messageId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `admin_support_tickets` (
  `id` VARCHAR(191) NOT NULL,
  `subject` VARCHAR(300) NOT NULL,
  `description` LONGTEXT NOT NULL,
  `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  `moduleTag` VARCHAR(100) NOT NULL,
  `status` ENUM('OPEN', 'PENDING', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
  `attachments` JSON NULL,
  `creatorId` VARCHAR(191) NOT NULL,
  `assignedToId` VARCHAR(191) NULL,
  `linkedMessageId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `resolvedAt` DATETIME(3) NULL,
  `closedAt` DATETIME(3) NULL,

  UNIQUE INDEX `admin_support_tickets_linkedMessageId_key`(`linkedMessageId`),
  INDEX `admin_support_tickets_creatorId_idx`(`creatorId`),
  INDEX `admin_support_tickets_assignedToId_idx`(`assignedToId`),
  INDEX `admin_support_tickets_status_idx`(`status`),
  INDEX `admin_support_tickets_priority_idx`(`priority`),
  INDEX `admin_support_tickets_moduleTag_idx`(`moduleTag`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `admin_support_ticket_updates` (
  `id` VARCHAR(191) NOT NULL,
  `ticketId` VARCHAR(191) NOT NULL,
  `authorId` VARCHAR(191) NOT NULL,
  `message` TEXT NULL,
  `statusFrom` ENUM('OPEN', 'PENDING', 'RESOLVED', 'CLOSED') NULL,
  `statusTo` ENUM('OPEN', 'PENDING', 'RESOLVED', 'CLOSED') NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `admin_support_ticket_updates_ticketId_idx`(`ticketId`),
  INDEX `admin_support_ticket_updates_authorId_idx`(`authorId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `admin_broadcasts` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `body` LONGTEXT NOT NULL,
  `severity` ENUM('INFO', 'WARNING', 'CRITICAL') NOT NULL DEFAULT 'INFO',
  `targetAll` BOOLEAN NOT NULL DEFAULT false,
  `targetRoles` JSON NULL,
  `sendEmailNotification` BOOLEAN NOT NULL DEFAULT false,
  `expiresAt` DATETIME(3) NULL,
  `requiresAcknowledgement` BOOLEAN NOT NULL DEFAULT false,
  `createdById` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `admin_broadcasts_severity_idx`(`severity`),
  INDEX `admin_broadcasts_targetAll_idx`(`targetAll`),
  INDEX `admin_broadcasts_expiresAt_idx`(`expiresAt`),
  INDEX `admin_broadcasts_createdAt_idx`(`createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `admin_broadcast_recipients` (
  `id` VARCHAR(191) NOT NULL,
  `broadcastId` VARCHAR(191) NOT NULL,
  `recipientId` VARCHAR(191) NOT NULL,
  `acknowledgedAt` DATETIME(3) NULL,
  `viewedAt` DATETIME(3) NULL,
  `emailNotificationSentAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `admin_broadcast_recipients_broadcastId_recipientId_key`(`broadcastId`, `recipientId`),
  INDEX `admin_broadcast_recipients_recipientId_acknowledgedAt_idx`(`recipientId`, `acknowledgedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `admin_communication_audit` (
  `id` VARCHAR(191) NOT NULL,
  `action` ENUM('LOGIN_SUCCESS', 'LOGIN_FAILED', 'SESSION_REVOKED', 'ADMIN_BLOCKED', 'ADMIN_UNBLOCKED', 'DIRECT_MESSAGE_SENT', 'GROUP_MESSAGE_SENT', 'MESSAGE_READ', 'MAILBOX_MESSAGE_STATUS_UPDATED', 'MAILBOX_MESSAGE_REPLIED', 'SUPPORT_TICKET_CREATED', 'SUPPORT_TICKET_UPDATED', 'BROADCAST_SENT', 'BROADCAST_ACKNOWLEDGED', 'MAILBOX_POLICY_UPDATED') NOT NULL,
  `actorId` VARCHAR(191) NULL,
  `senderId` VARCHAR(191) NULL,
  `recipientId` VARCHAR(191) NULL,
  `recipientRole` ENUM('SUPER_ADMIN', 'VERIFICATION_TEAM', 'SUPPORT_TEAM', 'OPERATIONS_TEAM', 'CONTENT_TEAM') NULL,
  `messageId` VARCHAR(191) NULL,
  `ticketId` VARCHAR(191) NULL,
  `broadcastId` VARCHAR(191) NULL,
  `ipAddress` VARCHAR(64) NULL,
  `readStatus` BOOLEAN NULL,
  `metadata` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `admin_communication_audit_action_idx`(`action`),
  INDEX `admin_communication_audit_actorId_idx`(`actorId`),
  INDEX `admin_communication_audit_senderId_idx`(`senderId`),
  INDEX `admin_communication_audit_recipientId_idx`(`recipientId`),
  INDEX `admin_communication_audit_recipientRole_idx`(`recipientRole`),
  INDEX `admin_communication_audit_messageId_idx`(`messageId`),
  INDEX `admin_communication_audit_ticketId_idx`(`ticketId`),
  INDEX `admin_communication_audit_broadcastId_idx`(`broadcastId`),
  INDEX `admin_communication_audit_createdAt_idx`(`createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Foreign keys
ALTER TABLE `admin_sessions`
  ADD CONSTRAINT `admin_sessions_adminUserId_fkey` FOREIGN KEY (`adminUserId`) REFERENCES `admin_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `admin_internal_messages`
  ADD CONSTRAINT `admin_internal_messages_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `admin_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `admin_internal_message_recipients`
  ADD CONSTRAINT `admin_internal_message_recipients_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `admin_internal_messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `admin_internal_message_recipients_recipientId_fkey` FOREIGN KEY (`recipientId`) REFERENCES `admin_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `admin_support_tickets`
  ADD CONSTRAINT `admin_support_tickets_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `admin_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `admin_support_tickets_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `admin_support_tickets_linkedMessageId_fkey` FOREIGN KEY (`linkedMessageId`) REFERENCES `admin_internal_messages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `admin_support_ticket_updates`
  ADD CONSTRAINT `admin_support_ticket_updates_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `admin_support_tickets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `admin_support_ticket_updates_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `admin_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `admin_broadcasts`
  ADD CONSTRAINT `admin_broadcasts_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `admin_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `admin_broadcast_recipients`
  ADD CONSTRAINT `admin_broadcast_recipients_broadcastId_fkey` FOREIGN KEY (`broadcastId`) REFERENCES `admin_broadcasts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `admin_broadcast_recipients_recipientId_fkey` FOREIGN KEY (`recipientId`) REFERENCES `admin_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `admin_communication_audit`
  ADD CONSTRAINT `admin_communication_audit_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `admin_communication_audit_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `admin_communication_audit_recipientId_fkey` FOREIGN KEY (`recipientId`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `admin_communication_audit_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `admin_internal_messages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `admin_communication_audit_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `admin_support_tickets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `admin_communication_audit_broadcastId_fkey` FOREIGN KEY (`broadcastId`) REFERENCES `admin_broadcasts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
