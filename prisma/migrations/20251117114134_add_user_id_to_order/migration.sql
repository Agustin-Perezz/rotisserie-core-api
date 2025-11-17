/*
  Warnings:

  - Added the required column `userId` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: Add userId column as nullable first
ALTER TABLE `Order` ADD COLUMN `userId` VARCHAR(191);

-- Update existing orders to set userId based on shop owner
UPDATE `Order` o
INNER JOIN `Shop` s ON o.shopId = s.id
SET o.userId = s.ownerId;

-- Make userId NOT NULL after populating data
ALTER TABLE `Order` MODIFY COLUMN `userId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
