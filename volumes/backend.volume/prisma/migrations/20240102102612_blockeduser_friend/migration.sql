/*
  Warnings:

  - You are about to drop the `BlockedUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Friend` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BlockedUser" DROP CONSTRAINT "BlockedUser_userId_fkey";

-- DropForeignKey
ALTER TABLE "Friend" DROP CONSTRAINT "Friend_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "blockedUserId" INTEGER,
ADD COLUMN     "friendId" INTEGER;

-- DropTable
DROP TABLE "BlockedUser";

-- DropTable
DROP TABLE "Friend";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_blockedUserId_fkey" FOREIGN KEY ("blockedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
