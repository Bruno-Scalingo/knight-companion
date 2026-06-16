import { AccessBanner } from "@/components/app/access-banner";
import { GaugeCard } from "@/components/app/gauge-card";
import { PageHeading } from "@/components/app/page-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { playerReadOnlyAccess } from "@/lib/access";
import { mockCharacter } from "@/lib/mock-data";

export default function PersonnagePage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Personnage"
        description="Identité, ressources et scores principaux du chevalier en mission."
      />
      <AccessBanner access={playerReadOnlyAccess} />

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{mockCharacter.name}</CardTitle>
              <Badge variant="secondary">{mockCharacter.codename}</Badge>
            </div>
            <CardDescription>
              {mockCharacter.archetype} · {mockCharacter.rank} · {mockCharacter.order}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <blockquote className="border-l-4 border-primary pl-4 text-sm italic text-muted-foreground">
              {mockCharacter.quote}
            </blockquote>
            <p className="text-sm leading-6 text-muted-foreground">{mockCharacter.biography}</p>
            <div className="rounded-md bg-muted p-3 text-sm">
              <span className="font-medium">Joueur :</span> {mockCharacter.playerName}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <GaugeCard label="Santé" gauge={mockCharacter.health} />
          <GaugeCard label="Énergie" gauge={mockCharacter.energy} tone="secondary" />
          <GaugeCard label="Espoir" gauge={mockCharacter.hope} tone="accent" />
          <GaugeCard label="Trauma" gauge={mockCharacter.trauma} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attributs</CardTitle>
            <CardDescription>Profil opérationnel.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {mockCharacter.attributes.map((attribute) => (
              <div key={attribute.key} className="rounded-md border p-4">
                <p className="text-sm text-muted-foreground">{attribute.label}</p>
                <p className="mt-2 text-3xl font-bold">{attribute.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compétences</CardTitle>
            <CardDescription>Spécialisations utiles en action.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockCharacter.skills.map((skill) => (
              <div key={skill.key} className="flex items-center justify-between rounded-md border px-4 py-3">
                <div>
                  <p className="font-medium">{skill.label}</p>
                  <p className="text-sm text-muted-foreground">{skill.attribute}</p>
                </div>
                <Badge variant="outline">+{skill.value}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
