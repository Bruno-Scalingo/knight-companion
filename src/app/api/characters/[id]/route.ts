import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import type { FoundryKnightActor, KnightCharacterDraft, ProgressionBlock } from "@/types/knight";

type CharacterRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

export async function GET(_request: Request, { params }: CharacterRouteContext) {
  const { id } = await params;
  const character = await prisma.character.findFirst({
    where: {
      OR: [{ id }, { slug: id }]
    },
    include: {
      imports: {
        orderBy: { createdAt: "desc" },
        take: 1
      },
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
  const latestImport = character?.imports[0];

  if (!character || !latestImport) {
    return NextResponse.json({ error: "Personnage introuvable." }, { status: 404 });
  }

  const normalizedCharacter = latestImport.normalizedJson as KnightCharacterDraft;
  const progressionOrder = readProgressionOrderIds(character.progressionOrder?.blockIds);

  const metaArmorImageUrl = character.metaArmorImage ? `/api/characters/${character.id}/meta-armor-image` : undefined;

  return NextResponse.json({
    id: character.id,
    importedAt: latestImport.createdAt.toISOString(),
    sourceFileName: latestImport.fileName ?? undefined,
    actor: latestImport.rawJson as FoundryKnightActor,
    character: {
      ...normalizedCharacter,
      portraitUrl: character.portraitUrl ?? normalizedCharacter.portraitUrl,
      metaArmor:
        normalizedCharacter.metaArmor && metaArmorImageUrl
          ? {
              ...normalizedCharacter.metaArmor,
              imageUrl: metaArmorImageUrl
            }
          : normalizedCharacter.metaArmor,
      progression: applyProgressionOrder(normalizedCharacter.progression, progressionOrder)
    }
  });
}
