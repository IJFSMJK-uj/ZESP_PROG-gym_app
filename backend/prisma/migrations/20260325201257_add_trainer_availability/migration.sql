-- CreateTable
CREATE TABLE "TrainerAvailability" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "gymId" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startHour" INTEGER NOT NULL,
    "endHour" INTEGER NOT NULL,

    CONSTRAINT "TrainerAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainerAvailability_trainerId_gymId_idx" ON "TrainerAvailability"("trainerId", "gymId");

-- CreateIndex
CREATE INDEX "TrainerAvailability_dayOfWeek_idx" ON "TrainerAvailability"("dayOfWeek");

-- AddForeignKey
ALTER TABLE "TrainerAvailability" ADD CONSTRAINT "TrainerAvailability_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerAvailability" ADD CONSTRAINT "TrainerAvailability_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;
