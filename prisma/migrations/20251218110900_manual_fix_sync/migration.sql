-- AlterTable
ALTER TABLE "User" ADD COLUMN "aiAutoAnalyzeNutrition" BOOLEAN DEFAULT false,
ADD COLUMN "aiAutoAnalyzeWorkouts" BOOLEAN DEFAULT false,
ADD COLUMN "aiModelPreference" TEXT DEFAULT 'flash',
ADD COLUMN "aiPersona" TEXT DEFAULT 'Supportive',
ADD COLUMN "city" TEXT,
ADD COLUMN "country" TEXT,
ADD COLUMN "distanceUnits" TEXT DEFAULT 'Kilometers',
ADD COLUMN "form" TEXT DEFAULT 'Absolute value',
ADD COLUMN "height" INTEGER,
ADD COLUMN "heightUnits" TEXT DEFAULT 'cm',
ADD COLUMN "hrZones" JSONB,
ADD COLUMN "language" TEXT DEFAULT 'English',
ADD COLUMN "powerZones" JSONB,
ADD COLUMN "restingHr" INTEGER,
ADD COLUMN "sex" TEXT,
ADD COLUMN "state" TEXT,
ADD COLUMN "temperatureUnits" TEXT DEFAULT 'Celsius',
ADD COLUMN "timezone" TEXT,
ADD COLUMN "visibility" TEXT DEFAULT 'Private',
ADD COLUMN "weightUnits" TEXT DEFAULT 'Kilograms';

-- AlterTable
ALTER TABLE "Workout" ADD COLUMN "calories" INTEGER,
ADD COLUMN "commute" BOOLEAN DEFAULT false,
ADD COLUMN "deviceName" TEXT,
ADD COLUMN "elapsedTimeSec" INTEGER,
ADD COLUMN "gearId" TEXT,
ADD COLUMN "isPrivate" BOOLEAN DEFAULT false;

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metric" TEXT,
    "currentValue" DOUBLE PRECISION,
    "targetValue" DOUBLE PRECISION,
    "startValue" DOUBLE PRECISION,
    "targetDate" TIMESTAMP(3),
    "eventDate" TIMESTAMP(3),
    "eventType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "aiContext" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Goal_userId_idx" ON "Goal"("userId");

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
