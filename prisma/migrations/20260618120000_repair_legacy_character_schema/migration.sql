ALTER TABLE "Character"
ADD COLUMN IF NOT EXISTS "portraitUrl" TEXT;

CREATE TABLE IF NOT EXISTS "CharacterPortrait" (
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

CREATE UNIQUE INDEX IF NOT EXISTS "CharacterPortrait_characterId_key" ON "CharacterPortrait"("characterId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'CharacterPortrait_characterId_fkey'
    ) THEN
        ALTER TABLE "CharacterPortrait"
        ADD CONSTRAINT "CharacterPortrait_characterId_fkey"
        FOREIGN KEY ("characterId") REFERENCES "Character"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "CharacterProgressionOrder" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "blockIds" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterProgressionOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CharacterProgressionOrder_characterId_key" ON "CharacterProgressionOrder"("characterId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'CharacterProgressionOrder_characterId_fkey'
    ) THEN
        ALTER TABLE "CharacterProgressionOrder"
        ADD CONSTRAINT "CharacterProgressionOrder_characterId_fkey"
        FOREIGN KEY ("characterId") REFERENCES "Character"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
    END IF;
END $$;
