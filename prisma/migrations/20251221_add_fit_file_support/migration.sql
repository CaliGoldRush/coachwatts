-- CreateTable
CREATE TABLE "FitFile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileData" BYTEA NOT NULL,
    "hash" TEXT NOT NULL,
    "workoutId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FitFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FitFile_workoutId_key" ON "FitFile"("workoutId");

-- CreateIndex
CREATE INDEX "FitFile_userId_idx" ON "FitFile"("userId");

-- CreateIndex
CREATE INDEX "FitFile_hash_idx" ON "FitFile"("hash");

-- AddForeignKey
ALTER TABLE "FitFile" ADD CONSTRAINT "FitFile_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FitFile" ADD CONSTRAINT "FitFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

