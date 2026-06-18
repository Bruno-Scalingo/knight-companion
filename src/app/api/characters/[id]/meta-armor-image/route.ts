import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type CharacterMetaArmorImageRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: CharacterMetaArmorImageRouteContext) {
  const { id } = await params;
  const character = await prisma.character.findFirst({
    where: {
      OR: [{ id }, { slug: id }]
    },
    include: {
      metaArmorImage: true
    }
  });

  if (!character?.metaArmorImage) {
    return NextResponse.json({ error: "Illustration de méta-armure introuvable." }, { status: 404 });
  }

  return new Response(new Uint8Array(character.metaArmorImage.data), {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Length": character.metaArmorImage.sizeBytes.toString(),
      "Content-Type": character.metaArmorImage.mimeType
    }
  });
}
