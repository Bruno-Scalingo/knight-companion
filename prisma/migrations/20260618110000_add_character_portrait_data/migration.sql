ALTER TABLE "Character"
ADD COLUMN "portraitMimeType" TEXT,
ADD COLUMN "portraitFileName" TEXT,
ADD COLUMN "portraitData" BYTEA,
ADD COLUMN "portraitUpdatedAt" TIMESTAMP(3);
