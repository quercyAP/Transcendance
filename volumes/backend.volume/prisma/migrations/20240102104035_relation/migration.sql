/*
  Warnings:

  - You are about to drop the column `blockedUserId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `friendId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_blockedUserId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_friendId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "blockedUserId",
DROP COLUMN "friendId",
ADD COLUMN     "blockedUserIds" INTEGER,
ADD COLUMN     "friendIds" INTEGER;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_blockedUserIds_fkey" FOREIGN KEY ("blockedUserIds") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_friendIds_fkey" FOREIGN KEY ("friendIds") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
