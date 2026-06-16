import { CharacterEvolutionView } from "@/components/app/character-detail-view";

type CharacterEvolutionPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CharacterEvolutionPage({ params }: CharacterEvolutionPageProps) {
  const { id } = await params;

  return <CharacterEvolutionView characterId={id} />;
}
