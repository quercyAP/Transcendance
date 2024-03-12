/*
  Warnings:

  - You are about to drop the column `role` on the `ChannelSubscription` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ChannelSubscription" DROP COLUMN "role",
ADD COLUMN     "roles" "ChannelSubscriptionRoleEnum"[];
