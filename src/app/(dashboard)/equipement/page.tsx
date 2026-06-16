import { PackageCheck } from "lucide-react";

import { AccessBanner } from "@/components/app/access-banner";
import { PageHeading } from "@/components/app/page-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { playerReadOnlyAccess } from "@/lib/access";
import { mockEquipment } from "@/lib/mock-data";

const slotCopy = {
  weapon: "Arme",
  armor: "Armure",
  module: "Module",
  relic: "Relique",
  consumable: "Consommable",
  other: "Autre"
};

export default function EquipementPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Équipement"
        description="Inventaire de séance avec les objets équipés, les consommables et les modules disponibles."
      />
      <AccessBanner access={playerReadOnlyAccess} />

      <section className="grid gap-4 md:grid-cols-2">
        {mockEquipment.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <PackageCheck className="h-4 w-4" aria-hidden="true" />
                    {item.name}
                  </CardTitle>
                  <CardDescription>
                    {slotCopy[item.slot]} · Quantité {item.quantity}
                  </CardDescription>
                </div>
                <Badge variant={item.equipped ? "secondary" : "muted"}>{item.equipped ? "Équipé" : "Réserve"}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
