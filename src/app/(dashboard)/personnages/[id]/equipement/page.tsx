import { CharacterEquipmentView } from "@/components/app/character-detail-view";

type CharacterEquipmentPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CharacterEquipmentPage({ params }: CharacterEquipmentPageProps) {
  const { id } = await params;

  return <CharacterEquipmentView characterId={id} />;
}
