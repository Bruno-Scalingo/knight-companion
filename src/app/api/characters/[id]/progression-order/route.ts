import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type CharacterProgressionOrderRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function readProgressionOrderIds(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
}

function toPrismaJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function findCharacter(id: string) {
  return prisma.character.findFirst({
    where: {
      OR: [{ id }, { slug: id }]
    },
    select: {
      id: true,
      progressionOrder: {
        select: {
          blockIds: true
        }
      }
    }
  });
}

export async function GET(_request: Request, { params }: CharacterProgressionOrderRouteContext) {
  const { id } = await params;
  const character = await findCharacter(id);

  if (!character) {
    return NextResponse.json({ error: "Personnage introuvable." }, { status: 404 });
  }

  return NextResponse.json({
    characterId: character.id,
    blockIds: readProgressionOrderIds(character.progressionOrder?.blockIds)
  });
}

export async function PUT(request: Request, { params }: CharacterProgressionOrderRouteContext) {
  try {
    const { id } = await params;
    const body = (await request.json()) as {
      blockIds?: unknown;
    };
    const blockIds = readProgressionOrderIds(body.blockIds);

    if (!Array.isArray(body.blockIds) || blockIds.length !== body.blockIds.length) {
      return NextResponse.json({ error: "L'ordre doit être une liste d'identifiants de blocs." }, { status: 400 });
    }

    const uniqueBlockIds = Array.from(new Set(blockIds));

    if (uniqueBlockIds.length !== blockIds.length) {
      return NextResponse.json({ error: "L'ordre contient des blocs dupliqués." }, { status: 400 });
    }

    const character = await findCharacter(id);

    if (!character) {
      return NextResponse.json({ error: "Personnage introuvable." }, { status: 404 });
    }

    await prisma.characterProgressionOrder.upsert({
      where: { characterId: character.id },
      update: {
        blockIds: toPrismaJson(blockIds)
      },
      create: {
        characterId: character.id,
        blockIds: toPrismaJson(blockIds)
      }
    });

    return NextResponse.json({
      characterId: character.id,
      blockIds
    });
  } catch (error) {
    console.error("[Progression Order API] Sauvegarde impossible", error);
    return NextResponse.json({ error: "Sauvegarde de l'ordre impossible." }, { status: 500 });
  }
}
