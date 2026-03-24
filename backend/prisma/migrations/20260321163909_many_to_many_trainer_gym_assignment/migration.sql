-- CreateTable
CREATE TABLE "TrainerAssignment" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "gymId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainerAssignment_trainerId_idx" ON "TrainerAssignment"("trainerId");

-- CreateIndex
CREATE INDEX "TrainerAssignment_gymId_idx" ON "TrainerAssignment"("gymId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainerAssignment_trainerId_gymId_key" ON "TrainerAssignment"("trainerId", "gymId");

-- AddForeignKey
ALTER TABLE "TrainerAssignment" ADD CONSTRAINT "TrainerAssignment_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerAssignment" ADD CONSTRAINT "TrainerAssignment_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;
