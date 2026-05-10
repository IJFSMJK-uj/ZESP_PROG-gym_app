/*
  Warnings:

  - You are about to drop the column `instructorName` on the `GroupClass` table. All the data in the column will be lost.
  - You are about to drop the column `room` on the `GroupClass` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "GroupClass" DROP COLUMN "instructorName",
DROP COLUMN "room";

-- CreateTable
CREATE TABLE "GroupClassInstructor" (
    "id" SERIAL NOT NULL,
    "classId" INTEGER NOT NULL,
    "assignmentId" INTEGER NOT NULL,

    CONSTRAINT "GroupClassInstructor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GroupClassInstructor_classId_idx" ON "GroupClassInstructor"("classId");

-- CreateIndex
CREATE INDEX "GroupClassInstructor_assignmentId_idx" ON "GroupClassInstructor"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupClassInstructor_classId_assignmentId_key" ON "GroupClassInstructor"("classId", "assignmentId");

-- AddForeignKey
ALTER TABLE "GroupClassInstructor" ADD CONSTRAINT "GroupClassInstructor_classId_fkey" FOREIGN KEY ("classId") REFERENCES "GroupClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupClassInstructor" ADD CONSTRAINT "GroupClassInstructor_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "TrainerAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
