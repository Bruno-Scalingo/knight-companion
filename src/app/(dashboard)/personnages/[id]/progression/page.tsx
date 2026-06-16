import { CharacterProgressionView } from "@/components/app/character-detail-view";

type CharacterProgressionPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CharacterProgressionPage({ params }: CharacterProgressionPageProps) {
  const { id } = await params;

  return <CharacterProgressionView characterId={id} />;
}
