-- CreateTable
CREATE TABLE "GroupClassEnrollment" (
    "id" SERIAL NOT NULL,
    "classId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupClassEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GroupClassEnrollment_classId_idx" ON "GroupClassEnrollment"("classId");

-- CreateIndex
CREATE INDEX "GroupClassEnrollment_userId_idx" ON "GroupClassEnrollment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupClassEnrollment_classId_userId_key" ON "GroupClassEnrollment"("classId", "userId");

-- AddForeignKey
ALTER TABLE "GroupClassEnrollment" ADD CONSTRAINT "GroupClassEnrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "GroupClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupClassEnrollment" ADD CONSTRAINT "GroupClassEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
