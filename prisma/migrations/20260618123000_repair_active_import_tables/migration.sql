DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'ImportStatus'
    ) THEN
        CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'PARSED', 'APPLIED', 'FAILED');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Campaign"
ADD COLUMN IF NOT EXISTS "name" TEXT,
ADD COLUMN IF NOT EXISTS "slug" TEXT,
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS "Campaign_slug_key" ON "Campaign"("slug");

CREATE TABLE IF NOT EXISTS "Character" (
    "id" TEXT NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Character"
ADD COLUMN IF NOT EXISTS "campaignId" TEXT,
ADD COLUMN IF NOT EXISTS "playerUserId" TEXT,
ADD COLUMN IF NOT EXISTS "name" TEXT,
ADD COLUMN IF NOT EXISTS "callsign" TEXT,
ADD COLUMN IF NOT EXISTS "slug" TEXT,
ADD COLUMN IF NOT EXISTS "portraitUrl" TEXT,
ADD COLUMN IF NOT EXISTS "age" TEXT,
ADD COLUMN IF NOT EXISTS "archetype" TEXT,
ADD COLUMN IF NOT EXISTS "section" TEXT,
ADD COLUMN IF NOT EXISTS "blazon" TEXT,
ADD COLUMN IF NOT EXISTS "feat" TEXT,
ADD COLUMN IF NOT EXISTS "description" TEXT,
ADD COLUMN IF NOT EXISTS "history" TEXT,
ADD COLUMN IF NOT EXISTS "motivations" TEXT,
ADD COLUMN IF NOT EXISTS "languages" JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS "distinctions" JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS "healthCurrent" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "healthMax" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "hopeCurrent" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "hopeMax" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "heroismCurrent" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "heroismMax" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "aegis" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "defense" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "reaction" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "aspects" JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "characteristics" JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "foundryActorId" TEXT,
ADD COLUMN IF NOT EXISTS "foundryData" JSONB,
ADD COLUMN IF NOT EXISTS "notesMj" TEXT,
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS "Character_foundryActorId_key" ON "Character"("foundryActorId");
CREATE UNIQUE INDEX IF NOT EXISTS "Character_campaignId_slug_key" ON "Character"("campaignId", "slug");
CREATE INDEX IF NOT EXISTS "Character_campaignId_idx" ON "Character"("campaignId");
CREATE INDEX IF NOT EXISTS "Character_playerUserId_idx" ON "Character"("playerUserId");
CREATE INDEX IF NOT EXISTS "Character_callsign_idx" ON "Character"("callsign");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'Character_campaignId_fkey'
    ) THEN
        ALTER TABLE "Character"
        ADD CONSTRAINT "Character_campaignId_fkey"
        FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "FoundryImport" (
    "id" TEXT NOT NULL,

    CONSTRAINT "FoundryImport_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "FoundryImport"
ADD COLUMN IF NOT EXISTS "campaignId" TEXT,
ADD COLUMN IF NOT EXISTS "characterId" TEXT,
ADD COLUMN IF NOT EXISTS "importedById" TEXT,
ADD COLUMN IF NOT EXISTS "fileName" TEXT,
ADD COLUMN IF NOT EXISTS "actorId" TEXT,
ADD COLUMN IF NOT EXISTS "actorName" TEXT,
ADD COLUMN IF NOT EXISTS "callsign" TEXT,
ADD COLUMN IF NOT EXISTS "sourceVersion" TEXT,
ADD COLUMN IF NOT EXISTS "status" "ImportStatus" DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS "rawJson" JSONB,
ADD COLUMN IF NOT EXISTS "normalizedJson" JSONB,
ADD COLUMN IF NOT EXISTS "errors" JSONB,
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "FoundryImport_campaignId_idx" ON "FoundryImport"("campaignId");
CREATE INDEX IF NOT EXISTS "FoundryImport_characterId_idx" ON "FoundryImport"("characterId");
CREATE INDEX IF NOT EXISTS "FoundryImport_actorId_idx" ON "FoundryImport"("actorId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'FoundryImport_campaignId_fkey'
    ) THEN
        ALTER TABLE "FoundryImport"
        ADD CONSTRAINT "FoundryImport_campaignId_fkey"
        FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'FoundryImport_characterId_fkey'
    ) THEN
        ALTER TABLE "FoundryImport"
        ADD CONSTRAINT "FoundryImport_characterId_fkey"
        FOREIGN KEY ("characterId") REFERENCES "Character"("id")
        ON DELETE SET NULL
        ON UPDATE CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "CharacterPortrait" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

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
