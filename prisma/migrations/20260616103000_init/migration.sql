-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PLAYER');

-- CreateEnum
CREATE TYPE "AccessScope" AS ENUM ('READ_ONLY', 'EDIT');

-- CreateEnum
CREATE TYPE "EquipmentSlot" AS ENUM ('WEAPON', 'ARMOR', 'MODULE', 'RELIC', 'CONSUMABLE', 'OTHER');

-- CreateEnum
CREATE TYPE "ProgressionStatus" AS ENUM ('AVAILABLE', 'SPENT', 'LOCKED');

-- CreateEnum
CREATE TYPE "EvolutionKind" AS ENUM ('ATTRIBUTE', 'SKILL', 'ARMOR', 'EQUIPMENT', 'NARRATIVE');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'PARSED', 'APPLIED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'PLAYER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignMember" (
    "campaignId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessScope" "AccessScope" NOT NULL DEFAULT 'READ_ONLY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignMember_pkey" PRIMARY KEY ("campaignId","userId")
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "playerUserId" TEXT,
    "name" TEXT NOT NULL,
    "codename" TEXT,
    "archetype" TEXT,
    "rank" TEXT,
    "orderName" TEXT,
    "quote" TEXT,
    "biography" TEXT,
    "glory" INTEGER NOT NULL DEFAULT 0,
    "healthCurrent" INTEGER NOT NULL DEFAULT 0,
    "healthMax" INTEGER NOT NULL DEFAULT 0,
    "energyCurrent" INTEGER NOT NULL DEFAULT 0,
    "energyMax" INTEGER NOT NULL DEFAULT 0,
    "hopeCurrent" INTEGER NOT NULL DEFAULT 0,
    "hopeMax" INTEGER NOT NULL DEFAULT 0,
    "traumaCurrent" INTEGER NOT NULL DEFAULT 0,
    "traumaMax" INTEGER NOT NULL DEFAULT 0,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "skills" JSONB NOT NULL DEFAULT '{}',
    "foundryActorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetaArmor" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "frame" TEXT,
    "generation" TEXT,
    "armorCurrent" INTEGER NOT NULL DEFAULT 0,
    "armorMax" INTEGER NOT NULL DEFAULT 0,
    "shieldCurrent" INTEGER NOT NULL DEFAULT 0,
    "shieldMax" INTEGER NOT NULL DEFAULT 0,
    "overdriveValue" INTEGER NOT NULL DEFAULT 0,
    "overdriveMax" INTEGER NOT NULL DEFAULT 0,
    "slots" JSONB NOT NULL DEFAULT '[]',
    "systems" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetaArmor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentItem" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slot" "EquipmentSlot" NOT NULL DEFAULT 'OTHER',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "equipped" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "bonuses" JSONB NOT NULL DEFAULT '{}',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquipmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressionBlock" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "bonusValue" INTEGER NOT NULL DEFAULT 1,
    "costXp" INTEGER NOT NULL DEFAULT 0,
    "status" "ProgressionStatus" NOT NULL DEFAULT 'AVAILABLE',
    "note" TEXT,
    "spentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressionBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvolutionEntry" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "progressionBlockId" TEXT,
    "kind" "EvolutionKind" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "xpCost" INTEGER NOT NULL DEFAULT 0,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvolutionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoundryImport" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "characterId" TEXT,
    "importedById" TEXT,
    "fileName" TEXT,
    "actorId" TEXT,
    "sourceVersion" TEXT,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "rawJson" JSONB NOT NULL,
    "normalizedJson" JSONB,
    "errors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoundryImport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_slug_key" ON "Campaign"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Character_foundryActorId_key" ON "Character"("foundryActorId");

-- CreateIndex
CREATE INDEX "Character_campaignId_idx" ON "Character"("campaignId");

-- CreateIndex
CREATE INDEX "Character_playerUserId_idx" ON "Character"("playerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "MetaArmor_characterId_key" ON "MetaArmor"("characterId");

-- CreateIndex
CREATE INDEX "EquipmentItem_characterId_idx" ON "EquipmentItem"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgressionBlock_characterId_blockNumber_key" ON "ProgressionBlock"("characterId", "blockNumber");

-- CreateIndex
CREATE INDEX "ProgressionBlock_characterId_status_idx" ON "ProgressionBlock"("characterId", "status");

-- CreateIndex
CREATE INDEX "EvolutionEntry_characterId_idx" ON "EvolutionEntry"("characterId");

-- CreateIndex
CREATE INDEX "EvolutionEntry_progressionBlockId_idx" ON "EvolutionEntry"("progressionBlockId");

-- CreateIndex
CREATE INDEX "FoundryImport_campaignId_idx" ON "FoundryImport"("campaignId");

-- CreateIndex
CREATE INDEX "FoundryImport_characterId_idx" ON "FoundryImport"("characterId");

-- CreateIndex
CREATE INDEX "FoundryImport_actorId_idx" ON "FoundryImport"("actorId");

-- AddForeignKey
ALTER TABLE "CampaignMember" ADD CONSTRAINT "CampaignMember_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignMember" ADD CONSTRAINT "CampaignMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_playerUserId_fkey" FOREIGN KEY ("playerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaArmor" ADD CONSTRAINT "MetaArmor_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentItem" ADD CONSTRAINT "EquipmentItem_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressionBlock" ADD CONSTRAINT "ProgressionBlock_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvolutionEntry" ADD CONSTRAINT "EvolutionEntry_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvolutionEntry" ADD CONSTRAINT "EvolutionEntry_progressionBlockId_fkey" FOREIGN KEY ("progressionBlockId") REFERENCES "ProgressionBlock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoundryImport" ADD CONSTRAINT "FoundryImport_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoundryImport" ADD CONSTRAINT "FoundryImport_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoundryImport" ADD CONSTRAINT "FoundryImport_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
