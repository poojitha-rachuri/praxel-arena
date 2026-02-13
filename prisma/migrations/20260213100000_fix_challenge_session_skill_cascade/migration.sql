-- DropForeignKey
ALTER TABLE "ChallengeSession" DROP CONSTRAINT "ChallengeSession_skillId_fkey";

-- AddForeignKey
ALTER TABLE "ChallengeSession" ADD CONSTRAINT "ChallengeSession_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
