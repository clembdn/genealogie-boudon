-- CreateEnum
CREATE TYPE "Sexe" AS ENUM ('homme', 'femme', 'inconnu');

-- CreateEnum
CREATE TYPE "UnionNature" AS ENUM ('mariage', 'union_libre', 'inconnue');

-- CreateEnum
CREATE TYPE "UnionCauseFin" AS ENUM ('divorce', 'deces', 'separation');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('photo', 'document', 'audio');

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenoms" TEXT NOT NULL DEFAULT '',
    "surnom" TEXT,
    "sexe" "Sexe" NOT NULL DEFAULT 'inconnu',
    "naissanceDate" TEXT,
    "naissanceLieu" TEXT,
    "decesDate" TEXT,
    "decesLieu" TEXT,
    "parrain" TEXT,
    "marraine" TEXT,
    "profession" TEXT,
    "recit" TEXT,
    "branche" TEXT,
    "vivant" BOOLEAN NOT NULL DEFAULT false,
    "ordreFratrie" INTEGER NOT NULL DEFAULT 0,
    "notesImport" TEXT,
    "unionParentaleId" TEXT,
    "photoPrincipaleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Union" (
    "id" TEXT NOT NULL,
    "partenaire1Id" TEXT,
    "partenaire2Id" TEXT,
    "nature" "UnionNature" NOT NULL DEFAULT 'inconnue',
    "dateDebut" TEXT,
    "lieuDebut" TEXT,
    "dateFin" TEXT,
    "causeFin" "UnionCauseFin",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Union_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "date" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Person_photoPrincipaleId_key" ON "Person"("photoPrincipaleId");

-- CreateIndex
CREATE INDEX "Person_unionParentaleId_idx" ON "Person"("unionParentaleId");

-- CreateIndex
CREATE INDEX "Person_nom_idx" ON "Person"("nom");

-- CreateIndex
CREATE INDEX "Media_personId_idx" ON "Media"("personId");

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_unionParentaleId_fkey" FOREIGN KEY ("unionParentaleId") REFERENCES "Union"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_photoPrincipaleId_fkey" FOREIGN KEY ("photoPrincipaleId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Union" ADD CONSTRAINT "Union_partenaire1Id_fkey" FOREIGN KEY ("partenaire1Id") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Union" ADD CONSTRAINT "Union_partenaire2Id_fkey" FOREIGN KEY ("partenaire2Id") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
