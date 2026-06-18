import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { normalizeFoundryKnightActor, validateFoundryKnightActor } from "@/lib/foundry-import";
import { prisma } from "@/lib/prisma";
import type { KnightCharacterDraft, ProgressionBlock } from "@/types/knight";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createCharacterId(actorId: string | undefined, actorName: string, callsign?: string) {
  const source =
    callsign && callsign.trim().length > 0
      ? callsign
      : actorId && actorId.trim().length > 0
        ? actorId
        : actorName;
  const slug = slugify(source);

  return `foundry-${slug || Date.now().toString(36)}`;
}

function toPrismaJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function readProgressionOrderIds(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
}

function applyProgressionOrder(blocks: ProgressionBlock[] | undefined, orderedIds: string[]) {
  if (!blocks || blocks.length === 0 || orderedIds.length === 0) {
    return blocks ?? [];
  }

  const blocksById = new Map(blocks.map((block) => [block.id, block]));
  const orderedBlocks = orderedIds
    .map((id) => blocksById.get(id))
    .filter((block): block is ProgressionBlock => Boolean(block));
  const orderedIdSet = new Set(orderedIds);
  const newBlocks = blocks.filter((block) => !orderedIdSet.has(block.id));

  return [...orderedBlocks, ...newBlocks];
}

type PortraitUpload = {
  dataUrl?: string;
  fileName?: string;
  mimeType?: string;
};

function parseImageUpload(upload: PortraitUpload | undefined, label: string) {
  if (!upload?.dataUrl) {
    return null;
  }

  const match = upload.dataUrl.match(/^data:(image\/(?:png|jpe?g|webp));base64,([a-z0-9+/=]+)$/i);

  if (!match) {
    throw new Error(`${label} doit être une image PNG, JPG ou WebP valide.`);
  }

  const mimeType = match[1].toLowerCase() === "image/jpg" ? "image/jpeg" : match[1].toLowerCase();
  const data = Buffer.from(match[2], "base64");
  const maxSizeBytes = 5 * 1024 * 1024;

  if (data.length === 0) {
    throw new Error(`${label} sélectionnée est vide.`);
  }

  if (data.length > maxSizeBytes) {
    throw new Error(`${label} ne doit pas dépasser 5 Mo.`);
  }

  return {
    data,
    fileName: upload.fileName,
    mimeType,
    sizeBytes: data.length
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      actor?: unknown;
      characterId?: string;
      sourceFileName?: string;
      portrait?: PortraitUpload;
      metaArmorImage?: PortraitUpload;
    };
    const validation = validateFoundryKnightActor(body.actor);

    if (!validation.valid) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }

    const normalizedCharacter = normalizeFoundryKnightActor(validation.actor);
    const characterId =
      body.characterId && body.characterId.trim().length > 0
        ? body.characterId
        : createCharacterId(validation.actor._id, normalizedCharacter.name, normalizedCharacter.callsign);
    const portraitUpload = parseImageUpload(body.portrait, "Le portrait");
    const metaArmorImageUpload = parseImageUpload(body.metaArmorImage, "L'illustration de la méta-armure");
    const portraitUrl = portraitUpload ? `/api/characters/${characterId}/portrait` : normalizedCharacter.portraitUrl;
    const uploadedMetaArmorImageUrl =
      normalizedCharacter.metaArmor && metaArmorImageUpload ? `/api/characters/${characterId}/meta-armor-image` : undefined;
    const normalizedCharacterWithPortrait = {
      ...normalizedCharacter,
      portraitUrl,
      metaArmor: normalizedCharacter.metaArmor
        ? {
            ...normalizedCharacter.metaArmor,
            imageUrl: uploadedMetaArmorImageUrl ?? normalizedCharacter.metaArmor.imageUrl
          }
        : normalizedCharacter.metaArmor
    };
    const campaign = await prisma.campaign.upsert({
      where: { slug: "default" },
      update: {},
      create: {
        name: "Campagne Knight",
        slug: "default"
      }
    });
    const existingCharacter = await prisma.character.findUnique({
      where: { id: characterId },
      select: {
        portraitUrl: true,
        metaArmorImage: {
          select: {
            id: true
          }
        },
        progressionOrder: {
          select: {
            blockIds: true
          }
        }
      }
    });
    const preservedPortraitUrl = portraitUpload ? portraitUrl : existingCharacter?.portraitUrl ?? normalizedCharacter.portraitUrl;
    const preservedMetaArmorImageUrl =
      normalizedCharacter.metaArmor && (metaArmorImageUpload || existingCharacter?.metaArmorImage)
        ? `/api/characters/${characterId}/meta-armor-image`
        : normalizedCharacterWithPortrait.metaArmor?.imageUrl;
    const storedProgressionOrder = readProgressionOrderIds(existingCharacter?.progressionOrder?.blockIds);
    const persistedNormalizedCharacter: KnightCharacterDraft = {
      ...normalizedCharacterWithPortrait,
      portraitUrl: preservedPortraitUrl,
      metaArmor: normalizedCharacterWithPortrait.metaArmor
        ? {
            ...normalizedCharacterWithPortrait.metaArmor,
            imageUrl: preservedMetaArmorImageUrl
          }
        : normalizedCharacterWithPortrait.metaArmor,
      progression: applyProgressionOrder(normalizedCharacterWithPortrait.progression, storedProgressionOrder)
    };
    const rawActorJson = toPrismaJson(validation.actor);
    const normalizedJson = toPrismaJson(persistedNormalizedCharacter);
    const languagesJson = toPrismaJson(persistedNormalizedCharacter.languages ?? []);
    const distinctionsJson = toPrismaJson(persistedNormalizedCharacter.distinctions ?? []);
    const aspectGroupsJson = toPrismaJson(persistedNormalizedCharacter.aspectGroups ?? []);
    const characteristicsJson = toPrismaJson(persistedNormalizedCharacter.characteristics ?? []);

    const character = await prisma.character.upsert({
      where: { id: characterId },
      update: {
        name: persistedNormalizedCharacter.name,
        callsign: persistedNormalizedCharacter.callsign || persistedNormalizedCharacter.name,
        slug: characterId,
        portraitUrl: preservedPortraitUrl,
        age: persistedNormalizedCharacter.age,
        archetype: persistedNormalizedCharacter.archetype,
        section: persistedNormalizedCharacter.section,
        blazon: persistedNormalizedCharacter.blazon,
        feat: persistedNormalizedCharacter.feat,
        description: persistedNormalizedCharacter.description,
        history: persistedNormalizedCharacter.history,
        motivations: persistedNormalizedCharacter.motivations,
        languages: languagesJson,
        distinctions: distinctionsJson,
        healthCurrent: persistedNormalizedCharacter.health?.current ?? 0,
        healthMax: persistedNormalizedCharacter.health?.max ?? 0,
        hopeCurrent: persistedNormalizedCharacter.hope?.current ?? 0,
        hopeMax: persistedNormalizedCharacter.hope?.max ?? 0,
        heroismCurrent: persistedNormalizedCharacter.heroism?.current ?? 0,
        heroismMax: persistedNormalizedCharacter.heroism?.max ?? 0,
        aegis: persistedNormalizedCharacter.aegis ?? 0,
        defense: persistedNormalizedCharacter.defense ?? 0,
        reaction: persistedNormalizedCharacter.reaction ?? 0,
        aspects: aspectGroupsJson,
        characteristics: characteristicsJson,
        foundryActorId: validation.actor._id,
        foundryData: rawActorJson
      },
      create: {
        id: characterId,
        campaignId: campaign.id,
        name: persistedNormalizedCharacter.name,
        callsign: persistedNormalizedCharacter.callsign || persistedNormalizedCharacter.name,
        slug: characterId,
        portraitUrl: preservedPortraitUrl,
        age: persistedNormalizedCharacter.age,
        archetype: persistedNormalizedCharacter.archetype,
        section: persistedNormalizedCharacter.section,
        blazon: persistedNormalizedCharacter.blazon,
        feat: persistedNormalizedCharacter.feat,
        description: persistedNormalizedCharacter.description,
        history: persistedNormalizedCharacter.history,
        motivations: persistedNormalizedCharacter.motivations,
        languages: languagesJson,
        distinctions: distinctionsJson,
        healthCurrent: persistedNormalizedCharacter.health?.current ?? 0,
        healthMax: persistedNormalizedCharacter.health?.max ?? 0,
        hopeCurrent: persistedNormalizedCharacter.hope?.current ?? 0,
        hopeMax: persistedNormalizedCharacter.hope?.max ?? 0,
        heroismCurrent: persistedNormalizedCharacter.heroism?.current ?? 0,
        heroismMax: persistedNormalizedCharacter.heroism?.max ?? 0,
        aegis: persistedNormalizedCharacter.aegis ?? 0,
        defense: persistedNormalizedCharacter.defense ?? 0,
        reaction: persistedNormalizedCharacter.reaction ?? 0,
        aspects: aspectGroupsJson,
        characteristics: characteristicsJson,
        foundryActorId: validation.actor._id,
        foundryData: rawActorJson
      }
    });

    if (portraitUpload) {
      await prisma.characterPortrait.upsert({
        where: { characterId: character.id },
        update: {
          fileName: portraitUpload.fileName,
          mimeType: portraitUpload.mimeType,
          data: portraitUpload.data,
          sizeBytes: portraitUpload.sizeBytes
        },
        create: {
          characterId: character.id,
          fileName: portraitUpload.fileName,
          mimeType: portraitUpload.mimeType,
          data: portraitUpload.data,
          sizeBytes: portraitUpload.sizeBytes
        }
      });
    }

    if (metaArmorImageUpload) {
      await prisma.characterMetaArmorImage.upsert({
        where: { characterId: character.id },
        update: {
          fileName: metaArmorImageUpload.fileName,
          mimeType: metaArmorImageUpload.mimeType,
          data: metaArmorImageUpload.data,
          sizeBytes: metaArmorImageUpload.sizeBytes
        },
        create: {
          characterId: character.id,
          fileName: metaArmorImageUpload.fileName,
          mimeType: metaArmorImageUpload.mimeType,
          data: metaArmorImageUpload.data,
          sizeBytes: metaArmorImageUpload.sizeBytes
        }
      });
    }

    await prisma.foundryImport.create({
      data: {
        campaignId: campaign.id,
        characterId: character.id,
        fileName: body.sourceFileName,
        actorId: validation.actor._id,
        actorName: validation.actor.name,
        callsign: persistedNormalizedCharacter.callsign,
        status: "APPLIED",
        rawJson: rawActorJson,
        normalizedJson
      }
    });

    return NextResponse.json({
      id: character.id,
      importedAt: new Date().toISOString(),
      sourceFileName: body.sourceFileName,
      actor: validation.actor,
      character: persistedNormalizedCharacter
    });
  } catch (error) {
    console.error("[Foundry Import API] Import serveur impossible", error);
    const message = error instanceof Error ? error.message : "Import serveur impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
