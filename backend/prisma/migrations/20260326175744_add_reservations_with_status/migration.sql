-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "TrainerReservation" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "gymId" INTEGER,
    "date" TIMESTAMP(3) NOT NULL,
    "startHour" INTEGER NOT NULL,
    "endHour" INTEGER NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "cancelledByUser" BOOLEAN NOT NULL DEFAULT false,
    "cancelledByTrainer" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainerReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainerReservation_trainerId_date_idx" ON "TrainerReservation"("trainerId", "date");

-- CreateIndex
CREATE INDEX "TrainerReservation_userId_idx" ON "TrainerReservation"("userId");

-- AddForeignKey
ALTER TABLE "TrainerReservation" ADD CONSTRAINT "TrainerReservation_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerReservation" ADD CONSTRAINT "TrainerReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerReservation" ADD CONSTRAINT "TrainerReservation_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;
