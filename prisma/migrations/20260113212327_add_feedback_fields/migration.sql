-- AlterTable
ALTER TABLE "Nutrition" ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "feedbackText" TEXT;

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "feedbackText" TEXT;

-- AlterTable
ALTER TABLE "Wellness" ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "feedbackText" TEXT;

-- AlterTable
ALTER TABLE "Workout" ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "feedbackText" TEXT;
