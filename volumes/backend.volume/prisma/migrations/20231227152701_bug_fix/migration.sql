/*
  Warnings:

  - You are about to drop the `channelSubscription` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ChannelSubscriptionTag" AS ENUM ('OWNER', 'ADMIN', 'BANNED', 'MUTED');

-- DropForeignKey
ALTER TABLE "channelSubscription" DROP CONSTRAINT "channelSubscription_channelId_fkey";

-- DropForeignKey
ALTER TABLE "channelSubscription" DROP CONSTRAINT "channelSubscription_userId_fkey";

-- DropTable
DROP TABLE "channelSubscription";

-- DropEnum
DROP TYPE "channelSubscriptionTag";

-- CreateTable
CREATE TABLE "ChannelSubscription" (
    "id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT,
    "userId" INTEGER NOT NULL,
    "channelId" INTEGER NOT NULL,
    "role" "ChannelSubscriptionTag" NOT NULL,

    CONSTRAINT "ChannelSubscription_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ChannelSubscription" ADD CONSTRAINT "ChannelSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelSubscription" ADD CONSTRAINT "ChannelSubscription_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
