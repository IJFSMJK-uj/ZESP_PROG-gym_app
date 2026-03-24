-- CreateTable
CREATE TABLE "GymInviteTrainer" (
    "id" SERIAL NOT NULL,
    "gymId" INTEGER NOT NULL,
    "hash" VARCHAR(128) NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "alreadyUsed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "GymInviteTrainer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GymInviteTrainer_hash_key" ON "GymInviteTrainer"("hash");

-- CreateIndex
CREATE INDEX "GymInviteTrainer_gymId_idx" ON "GymInviteTrainer"("gymId");

-- AddForeignKey
ALTER TABLE "GymInviteTrainer" ADD CONSTRAINT "GymInviteTrainer_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;
