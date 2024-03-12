-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currentUserId" INTEGER,
ADD COLUMN     "isOnline" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_currentUserId_fkey" FOREIGN KEY ("currentUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
