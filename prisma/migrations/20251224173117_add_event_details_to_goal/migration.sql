-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "distance" DOUBLE PRECISION,
ADD COLUMN     "duration" DOUBLE PRECISION,
ADD COLUMN     "elevation" INTEGER,
ADD COLUMN     "phase" TEXT,
ADD COLUMN     "terrain" TEXT;
