-- CreateEnum
CREATE TYPE "SprintMode" AS ENUM ('LEARN', 'PRACTICE', 'COMPETE');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('SPOT_THE_SIGNAL', 'FORCED_TRADEOFF', 'FILL_THE_GAP', 'RANK_AND_PRIORITIZE', 'CURVEBALL', 'TEACH_AND_TEST');

-- CreateEnum
CREATE TYPE "DuelStatus" AS ENUM ('WAITING', 'IN_PROGRESS', 'EVALUATING', 'COMPLETED', 'CANCELLED', 'FORFEIT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "imageUrl" TEXT,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerOutcome" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareerOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCareerGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "careerOutcomeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCareerGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillCareerMap" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "careerOutcomeId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "SkillCareerMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sprint" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "mode" "SprintMode" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isGenerated" BOOLEAN NOT NULL DEFAULT false,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL,
    "sprintId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "type" "InteractionType" NOT NULL,
    "order" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctAnswer" TEXT,
    "insightAnswer" TEXT,
    "teachingPreamble" TEXT,
    "priorContext" TEXT,
    "timeTarget" INTEGER NOT NULL DEFAULT 15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SprintCareerOutcome" (
    "id" TEXT NOT NULL,
    "sprintId" TEXT NOT NULL,
    "careerOutcomeId" TEXT NOT NULL,

    CONSTRAINT "SprintCareerOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SprintAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sprintId" TEXT NOT NULL,
    "mode" "SprintMode" NOT NULL,
    "responses" JSONB NOT NULL,
    "scores" JSONB,
    "totalScore" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "SprintAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSkillScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "analyticalThinking" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "strategicReasoning" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantitativeReasoning" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "communicationClarity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "decisionQuality" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creativeProblemSolving" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sprintCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSkillScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEloRating" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 1200,
    "matchCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserEloRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Duel" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "sprintId" TEXT,
    "player1Id" TEXT NOT NULL,
    "player2Id" TEXT,
    "player1AttemptId" TEXT,
    "player2AttemptId" TEXT,
    "winnerId" TEXT,
    "status" "DuelStatus" NOT NULL DEFAULT 'WAITING',
    "eloChange" INTEGER,
    "evaluation" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Duel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderboardEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "eloRating" INTEGER NOT NULL DEFAULT 1200,
    "rank" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaderboardEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CareerOutcome_name_key" ON "CareerOutcome"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CareerOutcome_slug_key" ON "CareerOutcome"("slug");

-- CreateIndex
CREATE INDEX "UserCareerGoal_userId_idx" ON "UserCareerGoal"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCareerGoal_userId_careerOutcomeId_key" ON "UserCareerGoal"("userId", "careerOutcomeId");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_slug_key" ON "Skill"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SkillCareerMap_skillId_careerOutcomeId_key" ON "SkillCareerMap"("skillId", "careerOutcomeId");

-- CreateIndex
CREATE INDEX "Sprint_skillId_mode_idx" ON "Sprint"("skillId", "mode");

-- CreateIndex
CREATE INDEX "Interaction_sprintId_order_idx" ON "Interaction"("sprintId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "SprintCareerOutcome_sprintId_careerOutcomeId_key" ON "SprintCareerOutcome"("sprintId", "careerOutcomeId");

-- CreateIndex
CREATE INDEX "SprintAttempt_userId_completedAt_idx" ON "SprintAttempt"("userId", "completedAt");

-- CreateIndex
CREATE INDEX "SprintAttempt_sprintId_idx" ON "SprintAttempt"("sprintId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSkillScore_userId_skillId_key" ON "UserSkillScore"("userId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "UserEloRating_userId_skillId_key" ON "UserEloRating"("userId", "skillId");

-- CreateIndex
CREATE INDEX "Duel_skillId_status_idx" ON "Duel"("skillId", "status");

-- CreateIndex
CREATE INDEX "Duel_player1Id_idx" ON "Duel"("player1Id");

-- CreateIndex
CREATE INDEX "Duel_player2Id_idx" ON "Duel"("player2Id");

-- CreateIndex
CREATE INDEX "Duel_winnerId_idx" ON "Duel"("winnerId");

-- CreateIndex
CREATE INDEX "LeaderboardEntry_skillId_eloRating_idx" ON "LeaderboardEntry"("skillId", "eloRating" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardEntry_userId_skillId_key" ON "LeaderboardEntry"("userId", "skillId");

-- AddForeignKey
ALTER TABLE "UserCareerGoal" ADD CONSTRAINT "UserCareerGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCareerGoal" ADD CONSTRAINT "UserCareerGoal_careerOutcomeId_fkey" FOREIGN KEY ("careerOutcomeId") REFERENCES "CareerOutcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillCareerMap" ADD CONSTRAINT "SkillCareerMap_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillCareerMap" ADD CONSTRAINT "SkillCareerMap_careerOutcomeId_fkey" FOREIGN KEY ("careerOutcomeId") REFERENCES "CareerOutcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sprint" ADD CONSTRAINT "Sprint_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SprintCareerOutcome" ADD CONSTRAINT "SprintCareerOutcome_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SprintCareerOutcome" ADD CONSTRAINT "SprintCareerOutcome_careerOutcomeId_fkey" FOREIGN KEY ("careerOutcomeId") REFERENCES "CareerOutcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SprintAttempt" ADD CONSTRAINT "SprintAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SprintAttempt" ADD CONSTRAINT "SprintAttempt_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkillScore" ADD CONSTRAINT "UserSkillScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkillScore" ADD CONSTRAINT "UserSkillScore_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEloRating" ADD CONSTRAINT "UserEloRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEloRating" ADD CONSTRAINT "UserEloRating_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Duel" ADD CONSTRAINT "Duel_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Duel" ADD CONSTRAINT "Duel_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Duel" ADD CONSTRAINT "Duel_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Duel" ADD CONSTRAINT "Duel_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Duel" ADD CONSTRAINT "Duel_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardEntry" ADD CONSTRAINT "LeaderboardEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardEntry" ADD CONSTRAINT "LeaderboardEntry_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
