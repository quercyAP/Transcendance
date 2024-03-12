/*
  Warnings:

  - You are about to drop the column `blockedUserIds` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `friendIds` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_blockedUserIds_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_friendIds_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "blockedUserIds",
DROP COLUMN "friendIds";
