import { CalendarDays } from "lucide-react";

import { AccessBanner } from "@/components/app/access-banner";
import { PageHeading } from "@/components/app/page-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { playerReadOnlyAccess } from "@/lib/access";
import { mockEvolutionEntries } from "@/lib/mock-data";

const kindCopy = {
  attribute: "Attribut",
  skill: "Compétence",
  armor: "Armure",
  equipment: "Équipement",
  narrative: "Narratif"
};

export default function EvolutionPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Évolution"
        description="Historique des améliorations appliquées et prochains jalons de campagne."
      />
      <AccessBanner access={playerReadOnlyAccess} />

      <Card>
        <CardHeader>
          <CardTitle>Journal d'évolution</CardTitle>
          <CardDescription>Chronologie des gains, modules et décisions marquantes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          {mockEvolutionEntries.map((entry, index) => (
            <div key={entry.id}>
              <article className="grid gap-4 py-4 sm:grid-cols-[10rem_1fr_auto] sm:items-start">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  {entry.date}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{entry.title}</h3>
                    <Badge variant="outline">{kindCopy[entry.kind]}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{entry.description}</p>
                </div>
                <Badge variant="secondary">{entry.xpCost} PX</Badge>
              </article>
              {index < mockEvolutionEntries.length - 1 ? <Separator /> : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
