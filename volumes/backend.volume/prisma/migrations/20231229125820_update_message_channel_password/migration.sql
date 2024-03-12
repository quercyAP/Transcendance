/*
  Warnings:

  - You are about to drop the column `type` on the `ChannelSubscription` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "password" TEXT,
ADD COLUMN     "type" "ChannelTypeEnum" NOT NULL DEFAULT 'PUBLIC';

-- AlterTable
ALTER TABLE "ChannelSubscription" DROP COLUMN "type";
