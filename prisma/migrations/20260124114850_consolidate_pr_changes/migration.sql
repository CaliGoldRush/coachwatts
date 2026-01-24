-- AlterTable
ALTER TABLE "User" ADD COLUMN     "nickname" TEXT,
ADD COLUMN     "nutritionTrackingEnabled" BOOLEAN NOT NULL DEFAULT true;
