-- CreateTable
CREATE TABLE "Nutrition" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "calories" INTEGER,
    "protein" DOUBLE PRECISION,
    "carbs" DOUBLE PRECISION,
    "fat" DOUBLE PRECISION,
    "fiber" DOUBLE PRECISION,
    "sugar" DOUBLE PRECISION,
    "breakfast" JSONB,
    "lunch" JSONB,
    "dinner" JSONB,
    "snacks" JSONB,
    "caloriesGoal" INTEGER,
    "proteinGoal" DOUBLE PRECISION,
    "carbsGoal" DOUBLE PRECISION,
    "fatGoal" DOUBLE PRECISION,
    "waterMl" INTEGER,
    "rawJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Nutrition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Nutrition_userId_date_idx" ON "Nutrition"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Nutrition_userId_date_key" ON "Nutrition"("userId", "date");

-- AddForeignKey
ALTER TABLE "Nutrition" ADD CONSTRAINT "Nutrition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
