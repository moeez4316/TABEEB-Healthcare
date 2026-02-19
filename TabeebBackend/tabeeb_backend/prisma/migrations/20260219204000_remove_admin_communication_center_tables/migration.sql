-- Remove Admin Communication Center tables and mailbox columns.
-- This migration is idempotent for mixed environments.

DROP TABLE IF EXISTS `admin_communication_audit`;
DROP TABLE IF EXISTS `admin_broadcast_recipients`;
DROP TABLE IF EXISTS `admin_support_ticket_updates`;
DROP TABLE IF EXISTS `admin_support_tickets`;
DROP TABLE IF EXISTS `admin_internal_message_recipients`;
DROP TABLE IF EXISTS `admin_broadcasts`;
DROP TABLE IF EXISTS `admin_internal_messages`;

SET @drop_mailbox_status := (
  SELECT IF(
    COUNT(*) = 0,
    'SELECT 1',
    'ALTER TABLE `admin_users` DROP COLUMN `mailboxStatus`'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'admin_users'
    AND COLUMN_NAME = 'mailboxStatus'
);
PREPARE stmt_drop_mailbox_status FROM @drop_mailbox_status;
EXECUTE stmt_drop_mailbox_status;
DEALLOCATE PREPARE stmt_drop_mailbox_status;

SET @drop_mailbox_forward_to := (
  SELECT IF(
    COUNT(*) = 0,
    'SELECT 1',
    'ALTER TABLE `admin_users` DROP COLUMN `mailboxForwardTo`'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'admin_users'
    AND COLUMN_NAME = 'mailboxForwardTo'
);
PREPARE stmt_drop_mailbox_forward_to FROM @drop_mailbox_forward_to;
EXECUTE stmt_drop_mailbox_forward_to;
DEALLOCATE PREPARE stmt_drop_mailbox_forward_to;
