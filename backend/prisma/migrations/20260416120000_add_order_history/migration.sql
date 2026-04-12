-- CreateTable
CREATE TABLE "OrderHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderData" JSONB NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedBy" TEXT NOT NULL,
    "reason" TEXT,

    CONSTRAINT "OrderHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderHistory_orderId_idx" ON "OrderHistory"("orderId");

-- CreateIndex
CREATE INDEX "OrderHistory_deletedAt_idx" ON "OrderHistory"("deletedAt");
