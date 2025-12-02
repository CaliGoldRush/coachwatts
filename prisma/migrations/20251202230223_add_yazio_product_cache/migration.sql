-- CreateTable
CREATE TABLE "YazioProductCache" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "baseUnit" TEXT,
    "nutrients" JSONB,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YazioProductCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "YazioProductCache_productId_key" ON "YazioProductCache"("productId");

-- CreateIndex
CREATE INDEX "YazioProductCache_productId_idx" ON "YazioProductCache"("productId");

-- CreateIndex
CREATE INDEX "YazioProductCache_expiresAt_idx" ON "YazioProductCache"("expiresAt");
