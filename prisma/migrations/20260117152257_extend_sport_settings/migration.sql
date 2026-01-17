-- AlterTable
ALTER TABLE "SportSettings" ADD COLUMN     "cooldownTime" INTEGER,
ADD COLUMN     "eFtp" INTEGER,
ADD COLUMN     "ePMax" INTEGER,
ADD COLUMN     "eWPrime" INTEGER,
ADD COLUMN     "eftpMinDuration" INTEGER,
ADD COLUMN     "hrLoadType" TEXT,
ADD COLUMN     "loadPreference" TEXT,
ADD COLUMN     "pMax" INTEGER,
ADD COLUMN     "powerSpikeThreshold" INTEGER,
ADD COLUMN     "restingHr" INTEGER,
ADD COLUMN     "warmupTime" INTEGER,
ADD COLUMN     "zoneConfiguration" JSONB;
