-- AlterTable
ALTER TABLE "PlannedWorkout" ADD COLUMN     "completionStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "structuredWorkout" JSONB,
ADD COLUMN     "trainingWeekId" TEXT;

-- CreateTable
CREATE TABLE "TrainingPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "strategy" TEXT NOT NULL DEFAULT 'LINEAR',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "currentBlockId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingBlock" (
    "id" TEXT NOT NULL,
    "trainingPlanId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "primaryFocus" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "durationWeeks" INTEGER NOT NULL,
    "recoveryWeekIndex" INTEGER,
    "progressionLogic" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingWeek" (
    "id" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "volumeTargetMinutes" INTEGER NOT NULL,
    "tssTarget" INTEGER NOT NULL,
    "isRecovery" BOOLEAN NOT NULL DEFAULT false,
    "focus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingWeek_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainingPlan_userId_status_idx" ON "TrainingPlan"("userId", "status");

-- CreateIndex
CREATE INDEX "TrainingBlock_trainingPlanId_order_idx" ON "TrainingBlock"("trainingPlanId", "order");

-- CreateIndex
CREATE INDEX "TrainingWeek_blockId_weekNumber_idx" ON "TrainingWeek"("blockId", "weekNumber");

-- AddForeignKey
ALTER TABLE "PlannedWorkout" ADD CONSTRAINT "PlannedWorkout_trainingWeekId_fkey" FOREIGN KEY ("trainingWeekId") REFERENCES "TrainingWeek"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingPlan" ADD CONSTRAINT "TrainingPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingPlan" ADD CONSTRAINT "TrainingPlan_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingBlock" ADD CONSTRAINT "TrainingBlock_trainingPlanId_fkey" FOREIGN KEY ("trainingPlanId") REFERENCES "TrainingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingWeek" ADD CONSTRAINT "TrainingWeek_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "TrainingBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
