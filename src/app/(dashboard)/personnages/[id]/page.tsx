import { CharacterDetailView } from "@/components/app/character-detail-view";

type CharacterPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CharacterPage({ params }: CharacterPageProps) {
  const { id } = await params;

  return <CharacterDetailView characterId={id} />;
}
