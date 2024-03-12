/*
  Warnings:

  - You are about to drop the column `isBanned` on the `ChannelSubscription` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ChannelSubscription" DROP COLUMN "isBanned";

-- CreateTable
CREATE TABLE "_banList" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_banList_AB_unique" ON "_banList"("A", "B");

-- CreateIndex
CREATE INDEX "_banList_B_index" ON "_banList"("B");

-- AddForeignKey
ALTER TABLE "_banList" ADD CONSTRAINT "_banList_A_fkey" FOREIGN KEY ("A") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_banList" ADD CONSTRAINT "_banList_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
