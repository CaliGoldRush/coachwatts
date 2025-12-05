-- AlterTable
ALTER TABLE "Workout" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "notesUpdatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Nutrition" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "notesUpdatedAt" TIMESTAMP(3);