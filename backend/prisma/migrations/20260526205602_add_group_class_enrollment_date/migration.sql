/*
  Warnings:

  - A unique constraint covering the columns `[classId,userId,date]` on the table `GroupClassEnrollment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `date` to the `GroupClassEnrollment` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "GroupClassEnrollment_classId_userId_key";

-- AlterTable
ALTER TABLE "GroupClassEnrollment" ADD COLUMN     "date" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "GroupClassEnrollment_classId_userId_date_key" ON "GroupClassEnrollment"("classId", "userId", "date");
