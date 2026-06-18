-- CreateTable
CREATE TABLE "CharacterProgressionOrder" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "blockIds" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterProgressionOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CharacterProgressionOrder_characterId_key" ON "CharacterProgressionOrder"("characterId");

-- AddForeignKey
ALTER TABLE "CharacterProgressionOrder" ADD CONSTRAINT "CharacterProgressionOrder_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
