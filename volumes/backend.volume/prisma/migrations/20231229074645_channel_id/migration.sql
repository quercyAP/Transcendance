/*
  Warnings:

  - The primary key for the `ChannelSubscription` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `ChannelSubscription` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `ChannelSubscription` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ChannelSubscription" DROP CONSTRAINT "ChannelSubscription_pkey",
DROP COLUMN "id",
DROP COLUMN "name",
ADD CONSTRAINT "ChannelSubscription_pkey" PRIMARY KEY ("userId", "channelId");
