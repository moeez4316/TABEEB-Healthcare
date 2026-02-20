-- CreateTable
CREATE TABLE `ai_chat_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `userUid` VARCHAR(255) NOT NULL,
    `title` VARCHAR(200) NOT NULL DEFAULT 'New Chat',
    `contextSummary` TEXT NULL,
    `summarizedUpTo` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ai_chat_sessions_userUid_idx`(`userUid`),
    INDEX `ai_chat_sessions_updatedAt_idx`(`updatedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ai_chat_messages` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `role` VARCHAR(10) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ai_chat_messages_sessionId_idx`(`sessionId`),
    INDEX `ai_chat_messages_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ai_chat_messages` ADD CONSTRAINT `ai_chat_messages_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `ai_chat_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
