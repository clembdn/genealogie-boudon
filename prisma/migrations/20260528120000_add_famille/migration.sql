-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "familleId" TEXT,
ALTER COLUMN "personId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "familleId" TEXT;

-- CreateTable
CREATE TABLE "Famille" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Famille_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Famille_slug_key" ON "Famille"("slug");

-- CreateIndex
CREATE INDEX "Media_familleId_idx" ON "Media"("familleId");

-- CreateIndex
CREATE INDEX "Person_familleId_idx" ON "Person"("familleId");

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_familleId_fkey" FOREIGN KEY ("familleId") REFERENCES "Famille"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_familleId_fkey" FOREIGN KEY ("familleId") REFERENCES "Famille"("id") ON DELETE CASCADE ON UPDATE CASCADE;