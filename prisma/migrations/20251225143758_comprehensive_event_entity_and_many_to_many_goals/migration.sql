/*
  Warnings:

  - You are about to drop the column `eventId` on the `Goal` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Goal" DROP CONSTRAINT "Goal_eventId_fkey";

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVirtual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "priority" TEXT DEFAULT 'B',
ADD COLUMN     "websiteUrl" TEXT;

-- AlterTable
ALTER TABLE "Goal" DROP COLUMN "eventId";

-- CreateTable
CREATE TABLE "_EventToGoal" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EventToGoal_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_EventToGoal_B_index" ON "_EventToGoal"("B");

-- AddForeignKey
ALTER TABLE "_EventToGoal" ADD CONSTRAINT "_EventToGoal_A_fkey" FOREIGN KEY ("A") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventToGoal" ADD CONSTRAINT "_EventToGoal_B_fkey" FOREIGN KEY ("B") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
