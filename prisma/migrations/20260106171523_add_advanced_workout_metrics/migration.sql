-- AlterTable
ALTER TABLE "Workout" ADD COLUMN     "carbsUsed" INTEGER,
ADD COLUMN     "hrLoad" DOUBLE PRECISION,
ADD COLUMN     "strainScore" DOUBLE PRECISION,
ADD COLUMN     "wBalDepletion" INTEGER,
ADD COLUMN     "wPrime" INTEGER,
ADD COLUMN     "workAboveFtp" INTEGER;
