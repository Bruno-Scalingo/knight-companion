import { CharacterMetaArmorView } from "@/components/app/character-detail-view";

type CharacterMetaArmorPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CharacterMetaArmorPage({ params }: CharacterMetaArmorPageProps) {
  const { id } = await params;

  return <CharacterMetaArmorView characterId={id} />;
}
