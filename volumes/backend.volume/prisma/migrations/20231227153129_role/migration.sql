/*
  Warnings:

  - Changed the type of `role` on the `ChannelSubscription` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ChannelSubscriptionRoleEnum" AS ENUM ('OWNER', 'ADMIN', 'BANNED', 'MUTED');

-- AlterTable
ALTER TABLE "ChannelSubscription" DROP COLUMN "role",
ADD COLUMN     "role" "ChannelSubscriptionRoleEnum" NOT NULL;

-- DropEnum
DROP TYPE "ChannelSubscriptionTag";
