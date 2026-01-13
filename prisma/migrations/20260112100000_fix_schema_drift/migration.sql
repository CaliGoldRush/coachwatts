-- AlterTable
ALTER TABLE "Recommendation" ADD COLUMN IF NOT EXISTS "category" TEXT;

-- AlterTable
ALTER TABLE "TrainingPlan" ADD COLUMN IF NOT EXISTS "customInstructions" TEXT;