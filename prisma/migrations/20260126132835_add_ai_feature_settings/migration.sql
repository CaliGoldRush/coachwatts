-- AlterTable
ALTER TABLE "User" ADD COLUMN     "aiDeepAnalysisEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "aiProactivityEnabled" BOOLEAN NOT NULL DEFAULT false;
