-- CreateTable
CREATE TABLE "CardSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "spicy" BOOLEAN NOT NULL DEFAULT false,
    "submittedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" DATETIME
);

-- CreateIndex
CREATE INDEX "CardSubmission_status_idx" ON "CardSubmission"("status");
