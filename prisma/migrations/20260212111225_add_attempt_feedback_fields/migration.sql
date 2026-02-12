-- AlterTable
ALTER TABLE "SprintAttempt" ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "highlights" JSONB,
ADD COLUMN     "improvements" JSONB;
