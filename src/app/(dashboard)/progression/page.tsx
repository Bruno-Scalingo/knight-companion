import { AccessBanner } from "@/components/app/access-banner";
import { PageHeading } from "@/components/app/page-heading";
import { ProgressionBlockCard } from "@/components/app/progression-block-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { playerReadOnlyAccess } from "@/lib/access";
import { mockProgressionBlocks } from "@/lib/mock-data";

export default function ProgressionPage() {
  const availableBlocks = mockProgressionBlocks.filter((block) => block.status === "available").length;
  const spentXp = mockProgressionBlocks
    .filter((block) => block.status === "spent")
    .reduce((total, block) => total + block.costXp, 0);

  return (
    <div className="space-y-6">
      <PageHeading
        title="Progression"
        description="Améliorations +1 suivies par coût, disponibilité et validation."
      />
      <AccessBanner access={playerReadOnlyAccess} />

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Blocs disponibles</CardDescription>
            <CardTitle>{availableBlocks}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>PX dépensés</CardDescription>
            <CardTitle>{spentXp}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Valeur d'un bloc</CardDescription>
            <CardTitle>+1</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Doctrine de progression</CardTitle>
          <CardDescription>Chaque avancement reste lisible et traçable.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">
            Les améliorations sont découpées en blocs simples de +1. Un bloc peut être disponible, dépensé ou verrouillé,
            avec un coût en PX et une note de campagne.
          </p>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {mockProgressionBlocks.map((block) => (
          <ProgressionBlockCard key={block.id} block={block} />
        ))}
      </section>
    </div>
  );
}
