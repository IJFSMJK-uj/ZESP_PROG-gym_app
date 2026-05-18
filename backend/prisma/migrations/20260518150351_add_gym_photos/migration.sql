-- AlterTable
ALTER TABLE "Gym" ADD COLUMN     "gallery" TEXT[],
ADD COLUMN     "mainImage" TEXT;

-- CreateTable
CREATE TABLE "StandardEquipment" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,

    CONSTRAINT "StandardEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GymEquipment" (
    "id" SERIAL NOT NULL,
    "gymId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "description" TEXT,

    CONSTRAINT "GymEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GymRoom" (
    "id" SERIAL NOT NULL,
    "gymId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER,

    CONSTRAINT "GymRoom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StandardEquipment_name_key" ON "StandardEquipment"("name");

-- CreateIndex
CREATE INDEX "GymRoom_gymId_idx" ON "GymRoom"("gymId");

-- AddForeignKey
ALTER TABLE "GymEquipment" ADD CONSTRAINT "GymEquipment_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymRoom" ADD CONSTRAINT "GymRoom_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupClass" ADD CONSTRAINT "GroupClass_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "GymRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;
