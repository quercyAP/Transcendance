/*
  Warnings:

  - The values [BANNED,MUTED] on the enum `ChannelSubscriptionRoleEnum` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `userId` on the `Message` table. All the data in the column will be lost.
  - Added the required column `senderId` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ChannelTypeEnum" AS ENUM ('PUBLIC', 'PRIVATE', 'PROTECTED');

-- CreateEnum
CREATE TYPE "MessageStatusEnum" AS ENUM ('DIRECT', 'CHANNEL');

-- AlterEnum
BEGIN;
CREATE TYPE "ChannelSubscriptionRoleEnum_new" AS ENUM ('OWNER', 'ADMIN');
ALTER TABLE "ChannelSubscription" ALTER COLUMN "roles" TYPE "ChannelSubscriptionRoleEnum_new"[] USING ("roles"::text::"ChannelSubscriptionRoleEnum_new"[]);
ALTER TYPE "ChannelSubscriptionRoleEnum" RENAME TO "ChannelSubscriptionRoleEnum_old";
ALTER TYPE "ChannelSubscriptionRoleEnum_new" RENAME TO "ChannelSubscriptionRoleEnum";
DROP TYPE "ChannelSubscriptionRoleEnum_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Friend" DROP CONSTRAINT "Friend_userId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_channelId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_userId_fkey";

-- AlterTable
ALTER TABLE "ChannelSubscription" ADD COLUMN     "isBanned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isMuted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "type" "ChannelTypeEnum" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN     "unMuteAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "userId",
ADD COLUMN     "receiverId" INTEGER,
ADD COLUMN     "senderId" INTEGER NOT NULL,
ADD COLUMN     "type" "MessageStatusEnum" NOT NULL,
ALTER COLUMN "channelId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
