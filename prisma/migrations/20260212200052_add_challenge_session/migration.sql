-- CreateEnum
CREATE TYPE "AIChallengeType" AS ENUM ('MOCK_INTERVIEW', 'SCENARIO_DRILL', 'SOCRATIC_COACHING', 'POST_SPRINT_DEBRIEF');

-- CreateEnum
CREATE TYPE "InputMode" AS ENUM ('TEXT', 'VOICE', 'MIXED');

-- CreateTable
CREATE TABLE "ChallengeSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "attemptId" TEXT,
    "challengeType" "AIChallengeType" NOT NULL,
    "inputMode" "InputMode" NOT NULL DEFAULT 'TEXT',
    "messages" JSONB NOT NULL,
    "exchangeCount" INTEGER NOT NULL DEFAULT 0,
    "durationSeconds" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ChallengeSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChallengeSession_userId_createdAt_idx" ON "ChallengeSession"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ChallengeSession_userId_challengeType_idx" ON "ChallengeSession"("userId", "challengeType");

-- CreateIndex
CREATE INDEX "ChallengeSession_skillId_challengeType_idx" ON "ChallengeSession"("skillId", "challengeType");

-- CreateIndex
CREATE INDEX "Challenge_skillId_idx" ON "Challenge"("skillId");

-- CreateIndex
CREATE INDEX "LeagueInstance_isActive_idx" ON "LeagueInstance"("isActive");

-- CreateIndex
CREATE INDEX "User_lastActivityDate_idx" ON "User"("lastActivityDate");

-- AddForeignKey
ALTER TABLE "ChallengeSession" ADD CONSTRAINT "ChallengeSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeSession" ADD CONSTRAINT "ChallengeSession_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeSession" ADD CONSTRAINT "ChallengeSession_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "SprintAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
