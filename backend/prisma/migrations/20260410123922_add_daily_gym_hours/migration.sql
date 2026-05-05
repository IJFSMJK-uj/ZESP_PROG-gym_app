-- CreateTable
CREATE TABLE "GymOperatingHours" (
    "id" SERIAL NOT NULL,
    "gymId" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "openTime" INTEGER NOT NULL,
    "closeTime" INTEGER NOT NULL,

    CONSTRAINT "GymOperatingHours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GymOperatingHours_gymId_idx" ON "GymOperatingHours"("gymId");

-- CreateIndex
CREATE UNIQUE INDEX "GymOperatingHours_gymId_dayOfWeek_key" ON "GymOperatingHours"("gymId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "GymOperatingHours" ADD CONSTRAINT "GymOperatingHours_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;
