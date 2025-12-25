-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "eventId" TEXT;

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "externalId" TEXT,
    "source" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT,
    "subType" TEXT,
    "distance" DOUBLE PRECISION,
    "elevation" INTEGER,
    "expectedDuration" DOUBLE PRECISION,
    "terrain" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Event_userId_idx" ON "Event"("userId");

-- CreateIndex
CREATE INDEX "Event_date_idx" ON "Event"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Event_userId_source_externalId_key" ON "Event"("userId", "source", "externalId");

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
