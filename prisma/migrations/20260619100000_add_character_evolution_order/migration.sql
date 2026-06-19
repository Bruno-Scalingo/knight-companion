CREATE TABLE IF NOT EXISTS "CharacterEvolutionOrder" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "blockIds" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CharacterEvolutionOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CharacterEvolutionOrder_characterId_key" ON "CharacterEvolutionOrder"("characterId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'CharacterEvolutionOrder_characterId_fkey'
    ) THEN
        ALTER TABLE "CharacterEvolutionOrder"
        ADD CONSTRAINT "CharacterEvolutionOrder_characterId_fkey"
        FOREIGN KEY ("characterId") REFERENCES "Character"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
    END IF;
END $$;
