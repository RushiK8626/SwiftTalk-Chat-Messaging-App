-- CreateTable
CREATE TABLE `AISession` (
    `session_id` VARCHAR(191) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `title` VARCHAR(191) NULL,
    `conversation` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_activity` DATETIME(3) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,

    INDEX `AISession_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `AISession_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`session_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AISession` ADD CONSTRAINT `AISession_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;
