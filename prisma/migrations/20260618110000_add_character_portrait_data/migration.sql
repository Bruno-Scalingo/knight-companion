-- CreateTable
CREATE TABLE "CharacterPortrait" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterPortrait_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CharacterPortrait_characterId_key" ON "CharacterPortrait"("characterId");

-- AddForeignKey
ALTER TABLE "CharacterPortrait" ADD CONSTRAINT "CharacterPortrait_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
