/*
  Warnings:

  - You are about to drop the column `authorId` on the `TrainerReview` table. All the data in the column will be lost.
  - You are about to drop the column `trainerId` on the `TrainerReview` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[reservationId]` on the table `TrainerReview` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `reservationId` to the `TrainerReview` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "TrainerReview" DROP CONSTRAINT "TrainerReview_authorId_fkey";

-- DropForeignKey
ALTER TABLE "TrainerReview" DROP CONSTRAINT "TrainerReview_trainerId_fkey";

-- DropIndex
DROP INDEX "TrainerReview_authorId_idx";

-- DropIndex
DROP INDEX "TrainerReview_trainerId_authorId_key";

-- DropIndex
DROP INDEX "TrainerReview_trainerId_idx";

-- AlterTable
ALTER TABLE "TrainerReview" DROP COLUMN "authorId",
DROP COLUMN "trainerId",
ADD COLUMN     "reservationId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "TrainerReview_reservationId_key" ON "TrainerReview"("reservationId");

-- AddForeignKey
ALTER TABLE "TrainerReview" ADD CONSTRAINT "TrainerReview_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "TrainerReservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
