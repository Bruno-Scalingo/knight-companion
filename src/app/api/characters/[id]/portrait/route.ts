import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const maxPortraitSize = 2 * 1024 * 1024;
const allowedPortraitTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

type CharacterPortraitRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: CharacterPortraitRouteContext) {
  const { id } = await params;
  const character = await prisma.character.findUnique({
    where: { id },
    select: {
      portraitData: true,
      portraitMimeType: true,
      portraitFileName: true,
      updatedAt: true
    }
  });

  if (!character?.portraitData || !character.portraitMimeType) {
    return NextResponse.json({ error: "Portrait introuvable." }, { status: 404 });
  }

  return new Response(new Uint8Array(character.portraitData), {
    headers: {
      "Cache-Control": "private, max-age=300",
      "Content-Disposition": `inline; filename="${character.portraitFileName ?? "portrait"}"`,
      "Content-Type": character.portraitMimeType,
      "Last-Modified": character.updatedAt.toUTCString()
    }
  });
}

export async function POST(request: Request, { params }: CharacterPortraitRouteContext) {
  const { id } = await params;
  const formData = await request.formData();
  const file = formData.get("portrait");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier portrait reçu." }, { status: 400 });
  }

  if (!allowedPortraitTypes.has(file.type)) {
    return NextResponse.json(
      { error: "Format non supporté. Utilise une image JPEG, PNG, WebP ou GIF." },
      { status: 400 }
    );
  }

  if (file.size > maxPortraitSize) {
    return NextResponse.json({ error: "Image trop lourde. Limite actuelle: 2 Mo." }, { status: 400 });
  }

  const characterExists = await prisma.character.findUnique({
    where: { id },
    select: { id: true }
  });

  if (!characterExists) {
    return NextResponse.json({ error: "Personnage introuvable en base." }, { status: 404 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  await prisma.character.update({
    where: { id },
    data: {
      portraitData: bytes,
      portraitFileName: file.name,
      portraitMimeType: file.type,
      portraitUpdatedAt: new Date(),
      portraitUrl: `/api/characters/${id}/portrait`
    }
  });

  return NextResponse.json({
    portraitUrl: `/api/characters/${id}/portrait`,
    fileName: file.name,
    mimeType: file.type
  });
}
