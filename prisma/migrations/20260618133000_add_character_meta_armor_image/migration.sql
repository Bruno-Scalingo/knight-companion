CREATE TABLE IF NOT EXISTS "CharacterMetaArmorImage" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CharacterMetaArmorImage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CharacterMetaArmorImage_characterId_key" ON "CharacterMetaArmorImage"("characterId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'CharacterMetaArmorImage_characterId_fkey'
    ) THEN
        ALTER TABLE "CharacterMetaArmorImage"
        ADD CONSTRAINT "CharacterMetaArmorImage_characterId_fkey"
        FOREIGN KEY ("characterId") REFERENCES "Character"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
    END IF;
END $$;
