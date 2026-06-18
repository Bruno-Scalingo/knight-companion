import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type CharacterPortraitRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: CharacterPortraitRouteContext) {
  const { id } = await params;
  const character = await prisma.character.findFirst({
    where: {
      OR: [{ id }, { slug: id }]
    },
    include: {
      portrait: true
    }
  });

  if (!character?.portrait) {
    return NextResponse.json({ error: "Portrait introuvable." }, { status: 404 });
  }

  return new Response(new Uint8Array(character.portrait.data), {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Length": character.portrait.sizeBytes.toString(),
      "Content-Type": character.portrait.mimeType
    }
  });
}
