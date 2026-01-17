-- CreateTable
CREATE TABLE "SportSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "types" TEXT[],
    "ftp" INTEGER,
    "indoorFtp" INTEGER,
    "wPrime" INTEGER,
    "powerZones" JSONB,
    "lthr" INTEGER,
    "maxHr" INTEGER,
    "hrZones" JSONB,
    "thresholdPace" DOUBLE PRECISION,
    "paceZones" JSONB,
    "source" TEXT NOT NULL DEFAULT 'intervals',
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SportSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SportSettings_userId_idx" ON "SportSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SportSettings_userId_source_externalId_key" ON "SportSettings"("userId", "source", "externalId");

-- AddForeignKey
ALTER TABLE "SportSettings" ADD CONSTRAINT "SportSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
