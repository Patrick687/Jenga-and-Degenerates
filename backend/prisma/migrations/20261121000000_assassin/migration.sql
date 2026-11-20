-- CreateTable
CREATE TABLE "PartyBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assassinSlot" INTEGER NOT NULL,
    "assassinPending" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'INNOCENT',
    "declinedAssassin" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ALIVE',
    "present" BOOLEAN NOT NULL DEFAULT true,
    "nextKillAt" DATETIME,
    "deathReason" TEXT,
    "diedAt" DATETIME,
    "killedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Player_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "PartyBatch" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Player_killedById_fkey" FOREIGN KEY ("killedById") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startedById" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "closedAt" DATETIME,
    "eliminatedId" TEXT,
    CONSTRAINT "Vote_startedById_fkey" FOREIGN KEY ("startedById") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Vote_eliminatedId_fkey" FOREIGN KEY ("eliminatedId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ballot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "voteId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Ballot_voteId_fkey" FOREIGN KEY ("voteId") REFERENCES "Vote" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Ballot_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Ballot_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GameEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kind" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "audienceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_nameKey_key" ON "Player"("nameKey");

-- CreateIndex
CREATE UNIQUE INDEX "Player_token_key" ON "Player"("token");

-- CreateIndex
CREATE INDEX "Player_batchId_idx" ON "Player"("batchId");

-- CreateIndex
CREATE INDEX "Vote_status_idx" ON "Vote"("status");

-- CreateIndex
CREATE INDEX "Ballot_candidateId_idx" ON "Ballot"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "Ballot_voteId_voterId_key" ON "Ballot"("voteId", "voterId");

-- CreateIndex
CREATE INDEX "GameEvent_audienceId_idx" ON "GameEvent"("audienceId");
