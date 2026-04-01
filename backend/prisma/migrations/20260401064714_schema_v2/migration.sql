/*
  Warnings:

  - The values [GYM] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `area` on the `Gym` table. All the data in the column will be lost.
  - You are about to drop the column `closeTime` on the `Gym` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Gym` table. All the data in the column will be lost.
  - You are about to drop the column `openTime` on the `Gym` table. All the data in the column will be lost.
  - You are about to drop the column `trainerRecommendation` on the `Gym` table. All the data in the column will be lost.
  - You are about to drop the column `alreadyUsed` on the `GymInviteTrainer` table. All the data in the column will be lost.
  - You are about to drop the column `trainerId` on the `TrainerAssignment` table. All the data in the column will be lost.
  - You are about to drop the column `gymId` on the `TrainerAvailability` table. All the data in the column will be lost.
  - You are about to drop the column `trainerId` on the `TrainerAvailability` table. All the data in the column will be lost.
  - You are about to drop the column `cancelledByTrainer` on the `TrainerReservation` table. All the data in the column will be lost.
  - You are about to drop the column `cancelledByUser` on the `TrainerReservation` table. All the data in the column will be lost.
  - You are about to drop the column `gymId` on the `TrainerReservation` table. All the data in the column will be lost.
  - You are about to drop the column `trainerId` on the `TrainerReservation` table. All the data in the column will be lost.
  - You are about to drop the column `gymId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[trainerProfileId,gymId]` on the table `TrainerAssignment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `createdById` to the `GymInviteTrainer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trainerProfileId` to the `TrainerAssignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `assignmentId` to the `TrainerAvailability` table without a default value. This is not possible if the table is not empty.
  - Added the required column `assignmentId` to the `TrainerReservation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('MEMBER', 'TRAINER', 'GYM_MANAGER');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'MEMBER';
COMMIT;

-- DropForeignKey
ALTER TABLE "TrainerAssignment" DROP CONSTRAINT "TrainerAssignment_trainerId_fkey";

-- DropForeignKey
ALTER TABLE "TrainerAvailability" DROP CONSTRAINT "TrainerAvailability_gymId_fkey";

-- DropForeignKey
ALTER TABLE "TrainerAvailability" DROP CONSTRAINT "TrainerAvailability_trainerId_fkey";

-- DropForeignKey
ALTER TABLE "TrainerReservation" DROP CONSTRAINT "TrainerReservation_gymId_fkey";

-- DropForeignKey
ALTER TABLE "TrainerReservation" DROP CONSTRAINT "TrainerReservation_trainerId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_gymId_fkey";

-- DropIndex
DROP INDEX "TrainerAssignment_trainerId_gymId_key";

-- DropIndex
DROP INDEX "TrainerAssignment_trainerId_idx";

-- DropIndex
DROP INDEX "TrainerAvailability_trainerId_gymId_idx";

-- DropIndex
DROP INDEX "TrainerReservation_trainerId_date_idx";

-- DropIndex
DROP INDEX "User_username_key";

-- AlterTable
ALTER TABLE "Gym" DROP COLUMN "area",
DROP COLUMN "closeTime",
DROP COLUMN "description",
DROP COLUMN "openTime",
DROP COLUMN "trainerRecommendation";

-- AlterTable
ALTER TABLE "GymInviteTrainer" DROP COLUMN "alreadyUsed",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" INTEGER NOT NULL,
ADD COLUMN     "usedById" INTEGER;

-- AlterTable
ALTER TABLE "TrainerAssignment" DROP COLUMN "trainerId",
ADD COLUMN     "trainerProfileId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "TrainerAvailability" DROP COLUMN "gymId",
DROP COLUMN "trainerId",
ADD COLUMN     "assignmentId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "TrainerReservation" DROP COLUMN "cancelledByTrainer",
DROP COLUMN "cancelledByUser",
DROP COLUMN "gymId",
DROP COLUMN "trainerId",
ADD COLUMN     "assignmentId" INTEGER NOT NULL,
ADD COLUMN     "cancelledById" INTEGER;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "gymId",
DROP COLUMN "username",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "MemberProfile" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "homeGymId" INTEGER,

    CONSTRAINT "MemberProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainerProfile" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "bio" TEXT,
    "phoneNumber" TEXT,

    CONSTRAINT "TrainerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ManagedGyms" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ManagedGyms_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "MemberProfile_userId_key" ON "MemberProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainerProfile_userId_key" ON "TrainerProfile"("userId");

-- CreateIndex
CREATE INDEX "_ManagedGyms_B_index" ON "_ManagedGyms"("B");

-- CreateIndex
CREATE INDEX "GymInviteTrainer_hash_idx" ON "GymInviteTrainer"("hash");

-- CreateIndex
CREATE INDEX "TrainerAssignment_trainerProfileId_idx" ON "TrainerAssignment"("trainerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainerAssignment_trainerProfileId_gymId_key" ON "TrainerAssignment"("trainerProfileId", "gymId");

-- CreateIndex
CREATE INDEX "TrainerAvailability_assignmentId_idx" ON "TrainerAvailability"("assignmentId");

-- CreateIndex
CREATE INDEX "TrainerReservation_assignmentId_date_idx" ON "TrainerReservation"("assignmentId", "date");

-- AddForeignKey
ALTER TABLE "MemberProfile" ADD CONSTRAINT "MemberProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberProfile" ADD CONSTRAINT "MemberProfile_homeGymId_fkey" FOREIGN KEY ("homeGymId") REFERENCES "Gym"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerProfile" ADD CONSTRAINT "TrainerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerAssignment" ADD CONSTRAINT "TrainerAssignment_trainerProfileId_fkey" FOREIGN KEY ("trainerProfileId") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerAvailability" ADD CONSTRAINT "TrainerAvailability_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "TrainerAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerReservation" ADD CONSTRAINT "TrainerReservation_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "TrainerAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerReservation" ADD CONSTRAINT "TrainerReservation_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymInviteTrainer" ADD CONSTRAINT "GymInviteTrainer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymInviteTrainer" ADD CONSTRAINT "GymInviteTrainer_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ManagedGyms" ADD CONSTRAINT "_ManagedGyms_A_fkey" FOREIGN KEY ("A") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ManagedGyms" ADD CONSTRAINT "_ManagedGyms_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
