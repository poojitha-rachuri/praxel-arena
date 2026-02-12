-- DropIndex
DROP INDEX "Sprint_skillId_mode_idx";

-- AlterTable
ALTER TABLE "Sprint" ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "levelLabel" TEXT,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Sprint_skillId_mode_level_order_idx" ON "Sprint"("skillId", "mode", "level", "order");

-- CreateIndex
CREATE INDEX "SprintAttempt_userId_mode_idx" ON "SprintAttempt"("userId", "mode");
