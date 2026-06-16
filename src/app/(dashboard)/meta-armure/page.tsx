import { Activity, Cpu } from "lucide-react";

import { AccessBanner } from "@/components/app/access-banner";
import { GaugeCard } from "@/components/app/gauge-card";
import { PageHeading } from "@/components/app/page-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { playerReadOnlyAccess } from "@/lib/access";
import { mockMetaArmor } from "@/lib/mock-data";

const systemStatus = {
  online: "En ligne",
  limited: "Limité",
  offline: "Hors ligne"
};

export default function MetaArmurePage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Méta-armure"
        description="Suivi des ressources d'armure, des emplacements et des systèmes embarqués."
      />
      <AccessBanner access={playerReadOnlyAccess} />

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{mockMetaArmor.name}</CardTitle>
            <CardDescription>
              {mockMetaArmor.frame} · {mockMetaArmor.generation}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <GaugeCard label="Armure" gauge={mockMetaArmor.armorPoints} />
            <GaugeCard label="Bouclier" gauge={mockMetaArmor.shieldPoints} tone="secondary" />
            <GaugeCard label="Overdrive" gauge={mockMetaArmor.overdrive} tone="accent" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" aria-hidden="true" />
              Emplacements
            </CardTitle>
            <CardDescription>Occupation actuelle des modules de la méta-armure.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {mockMetaArmor.slots.map((slot) => (
              <div key={slot.key} className="rounded-md border p-4">
                <p className="text-sm text-muted-foreground">{slot.label}</p>
                <p className="mt-2 font-semibold">{slot.occupiedBy ?? "Libre"}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" aria-hidden="true" />
            Systèmes embarqués
          </CardTitle>
          <CardDescription>État de fonctionnement à afficher en séance.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {mockMetaArmor.systems.map((system) => (
            <div key={system.id} className="rounded-md border p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold">{system.name}</h3>
                <Badge variant={system.status === "online" ? "secondary" : system.status === "limited" ? "accent" : "muted"}>
                  {systemStatus[system.status]}
                </Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{system.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
