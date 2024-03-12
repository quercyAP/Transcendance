-- CreateTable
CREATE TABLE "_pendingFriends" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_pendingFriends_AB_unique" ON "_pendingFriends"("A", "B");

-- CreateIndex
CREATE INDEX "_pendingFriends_B_index" ON "_pendingFriends"("B");

-- AddForeignKey
ALTER TABLE "_pendingFriends" ADD CONSTRAINT "_pendingFriends_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_pendingFriends" ADD CONSTRAINT "_pendingFriends_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
