-- CreateEnum
CREATE TYPE "XpSource" AS ENUM ('SPRINT', 'DUEL_WIN', 'CHALLENGE', 'STREAK_BONUS', 'DAILY_BONUS', 'LEAGUE_REWARD', 'LEVEL_UP');

-- CreateEnum
CREATE TYPE "ChallengeType" AS ENUM ('SPEED_ROUND', 'SCORE_ATTACK');

-- CreateEnum
CREATE TYPE "CredentialType" AS ENUM ('PRACTITIONER', 'EXPERT', 'MASTER', 'GRANDMASTER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currentStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastActivityDate" TIMESTAMP(3),
ADD COLUMN     "leagueTier" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "longestStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "title" TEXT NOT NULL DEFAULT 'Intern',
ADD COLUMN     "weeklyXp" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "xp" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "XpTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" "XpSource" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XpTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "type" "ChallengeType" NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "skillId" TEXT,
    "config" JSONB NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rewardXpFirst" INTEGER NOT NULL DEFAULT 250,
    "rewardXpTenth" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "timeSpentMs" INTEGER NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChallengeAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueInstance" (
    "id" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeagueInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leagueInstanceId" TEXT NOT NULL,
    "weeklyXp" INTEGER NOT NULL DEFAULT 0,
    "finalRank" INTEGER,
    "promoted" BOOLEAN NOT NULL DEFAULT false,
    "demoted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeagueMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EloSeason" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "seasonStart" TIMESTAMP(3) NOT NULL,
    "seasonEnd" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EloSeason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSeasonStats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eloSeasonId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "startElo" INTEGER NOT NULL DEFAULT 1200,
    "peakElo" INTEGER NOT NULL DEFAULT 1200,
    "endElo" INTEGER NOT NULL DEFAULT 1200,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "matchCount" INTEGER NOT NULL DEFAULT 0,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserSeasonStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "type" "CredentialType" NOT NULL,
    "eloAtGrant" INTEGER NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationCode" TEXT NOT NULL,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "XpTransaction_userId_createdAt_idx" ON "XpTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "XpTransaction_userId_source_idx" ON "XpTransaction"("userId", "source");

-- CreateIndex
CREATE INDEX "Challenge_isActive_startsAt_endsAt_idx" ON "Challenge"("isActive", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "Challenge_type_isActive_idx" ON "Challenge"("type", "isActive");

-- CreateIndex
CREATE INDEX "ChallengeAttempt_challengeId_score_idx" ON "ChallengeAttempt"("challengeId", "score" DESC);

-- CreateIndex
CREATE INDEX "ChallengeAttempt_challengeId_timeSpentMs_idx" ON "ChallengeAttempt"("challengeId", "timeSpentMs" ASC);

-- CreateIndex
CREATE INDEX "ChallengeAttempt_userId_challengeId_idx" ON "ChallengeAttempt"("userId", "challengeId");

-- CreateIndex
CREATE INDEX "LeagueInstance_tier_isActive_idx" ON "LeagueInstance"("tier", "isActive");

-- CreateIndex
CREATE INDEX "LeagueInstance_weekStart_weekEnd_idx" ON "LeagueInstance"("weekStart", "weekEnd");

-- CreateIndex
CREATE INDEX "LeagueMembership_leagueInstanceId_weeklyXp_idx" ON "LeagueMembership"("leagueInstanceId", "weeklyXp" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "LeagueMembership_userId_leagueInstanceId_key" ON "LeagueMembership"("userId", "leagueInstanceId");

-- CreateIndex
CREATE INDEX "EloSeason_isActive_idx" ON "EloSeason"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "EloSeason_month_year_key" ON "EloSeason"("month", "year");

-- CreateIndex
CREATE INDEX "UserSeasonStats_eloSeasonId_skillId_peakElo_idx" ON "UserSeasonStats"("eloSeasonId", "skillId", "peakElo" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "UserSeasonStats_userId_eloSeasonId_skillId_key" ON "UserSeasonStats"("userId", "eloSeasonId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_verificationCode_key" ON "Credential"("verificationCode");

-- CreateIndex
CREATE INDEX "Credential_verificationCode_idx" ON "Credential"("verificationCode");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_userId_skillId_type_key" ON "Credential"("userId", "skillId", "type");

-- CreateIndex
CREATE INDEX "SprintAttempt_userId_sprintId_completedAt_idx" ON "SprintAttempt"("userId", "sprintId", "completedAt");

-- AddForeignKey
ALTER TABLE "XpTransaction" ADD CONSTRAINT "XpTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeAttempt" ADD CONSTRAINT "ChallengeAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeAttempt" ADD CONSTRAINT "ChallengeAttempt_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueMembership" ADD CONSTRAINT "LeagueMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueMembership" ADD CONSTRAINT "LeagueMembership_leagueInstanceId_fkey" FOREIGN KEY ("leagueInstanceId") REFERENCES "LeagueInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSeasonStats" ADD CONSTRAINT "UserSeasonStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSeasonStats" ADD CONSTRAINT "UserSeasonStats_eloSeasonId_fkey" FOREIGN KEY ("eloSeasonId") REFERENCES "EloSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSeasonStats" ADD CONSTRAINT "UserSeasonStats_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
