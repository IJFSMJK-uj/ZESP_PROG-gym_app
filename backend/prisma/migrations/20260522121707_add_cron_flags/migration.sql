-- AlterTable
ALTER TABLE "TrainerReservation" ADD COLUMN     "reminderSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reviewPromptSent" BOOLEAN NOT NULL DEFAULT false;
