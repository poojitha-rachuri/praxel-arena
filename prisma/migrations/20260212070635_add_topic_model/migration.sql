-- AlterTable
ALTER TABLE "Sprint" ADD COLUMN     "topicId" TEXT;

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Topic_skillId_order_idx" ON "Topic"("skillId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_skillId_slug_key" ON "Topic"("skillId", "slug");

-- CreateIndex
CREATE INDEX "Sprint_topicId_mode_order_idx" ON "Sprint"("topicId", "mode", "order");

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sprint" ADD CONSTRAINT "Sprint_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
