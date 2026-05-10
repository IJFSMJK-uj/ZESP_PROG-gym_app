-- CreateTable
CREATE TABLE "GroupClass" (
    "id" SERIAL NOT NULL,
    "gymId" INTEGER NOT NULL,
    "room" INTEGER,
    "roomId" INTEGER,
    "name" TEXT NOT NULL,
    "instructorName" TEXT,
    "description" TEXT,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" INTEGER NOT NULL,
    "endTime" INTEGER NOT NULL,
    "capacity" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupClass_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GroupClass_gymId_dayOfWeek_idx" ON "GroupClass"("gymId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "GroupClass_roomId_idx" ON "GroupClass"("roomId");

-- AddForeignKey
ALTER TABLE "GroupClass" ADD CONSTRAINT "GroupClass_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;
