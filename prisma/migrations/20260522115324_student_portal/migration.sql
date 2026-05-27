-- CreateEnum
CREATE TYPE "DocumentRequestType" AS ENUM ('TRANSCRIPT', 'ENROLLMENT_VERIFICATION', 'CHARACTER_CERTIFICATE');

-- CreateEnum
CREATE TYPE "DocumentRequestStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'REJECTED');

-- CreateTable
CREATE TABLE "CampusAnnouncement" (
    "id" TEXT NOT NULL,
    "campusId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampusAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentDocumentRequest" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" "DocumentRequestType" NOT NULL,
    "status" "DocumentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentDocumentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentFeedback" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "category" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentMessage" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentCampusWallet" (
    "studentId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentCampusWallet_pkey" PRIMARY KEY ("studentId")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CampusAnnouncement_campusId_publishedAt_idx" ON "CampusAnnouncement"("campusId", "publishedAt");

-- CreateIndex
CREATE INDEX "StudentDocumentRequest_studentId_idx" ON "StudentDocumentRequest"("studentId");

-- CreateIndex
CREATE INDEX "StudentFeedback_createdAt_idx" ON "StudentFeedback"("createdAt");

-- CreateIndex
CREATE INDEX "StudentMessage_studentId_idx" ON "StudentMessage"("studentId");

-- CreateIndex
CREATE INDEX "WalletTransaction_studentId_createdAt_idx" ON "WalletTransaction"("studentId", "createdAt");

-- AddForeignKey
ALTER TABLE "CampusAnnouncement" ADD CONSTRAINT "CampusAnnouncement_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentDocumentRequest" ADD CONSTRAINT "StudentDocumentRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeedback" ADD CONSTRAINT "StudentFeedback_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentMessage" ADD CONSTRAINT "StudentMessage_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentMessage" ADD CONSTRAINT "StudentMessage_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentCampusWallet" ADD CONSTRAINT "StudentCampusWallet_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
