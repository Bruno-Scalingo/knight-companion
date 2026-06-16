"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Activity, AlertCircle, ArrowLeft, CalendarDays, Cpu, FileJson2, PackageCheck } from "lucide-react";

import { AccessBanner } from "@/components/app/access-banner";
import { GaugeCard } from "@/components/app/gauge-card";
import { PageHeading } from "@/components/app/page-heading";
import { ProgressionBlockCard } from "@/components/app/progression-block-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { playerReadOnlyAccess } from "@/lib/access";
import { readImportedCharacterById } from "@/lib/imported-character-store";
import {
  mockCharacter,
  mockEquipment,
  mockEvolutionEntries,
  mockMetaArmor,
  mockProgressionBlocks
} from "@/lib/mock-data";
import type {
  EquipmentItem,
  EvolutionEntry,
  ImportedKnightCharacter,
  KnightCharacter,
  MetaArmor,
  ProgressionBlock
} from "@/types/knight";

const equipmentSlotCopy = {
  weapon: "Arme",
  armor: "Armure",
  module: "Module",
  relic: "Relique",
  consumable: "Consommable",
  other: "Autre"
} as const;

const evolutionKindCopy = {
  attribute: "Attribut",
  skill: "Compétence",
  armor: "Armure",
  equipment: "Équipement",
  narrative: "Narratif"
} as const;

const systemStatusCopy = {
  online: "En ligne",
  limited: "Limité",
  offline: "Hors ligne"
} as const;

type ResolvedCharacterData = {
  source: "mock" | "imported";
  character: KnightCharacter;
  metaArmor: MetaArmor | null;
  equipment: EquipmentItem[];
  progression: ProgressionBlock[];
  evolution: EvolutionEntry[];
  importedRecord?: ImportedKnightCharacter;
};

type CharacterState =
  | {
      status: "loading";
    }
  | {
      status: "error";
      message: string;
    }
  | {
      status: "ready";
      data: ResolvedCharacterData;
    };

type CharacterViewProps = {
  characterId: string;
};

function buildMockCharacterData(): ResolvedCharacterData {
  return {
    source: "mock",
    character: mockCharacter,
    metaArmor: mockMetaArmor,
    equipment: mockEquipment,
    progression: mockProgressionBlocks,
    evolution: mockEvolutionEntries
  };
}

function buildImportedCharacterData(record: ImportedKnightCharacter): ResolvedCharacterData {
  const draft = record.character;

  return {
    source: "imported",
    character: {
      id: record.id,
      name: draft.name,
      codename: draft.codename ?? "",
      playerName: "Import Foundry",
      archetype: draft.archetype ?? "",
      rank: draft.rank ?? "",
      order: draft.order ?? "",
      quote: draft.quote ?? "",
      biography: draft.biography ?? "",
      health: draft.health ?? { current: 0, max: 0 },
      energy: draft.energy ?? { current: 0, max: 0 },
      hope: draft.hope ?? { current: 0, max: 0 },
      trauma: draft.trauma ?? { current: 0, max: 0 },
      aspects: draft.aspects ?? [],
      characteristics: draft.characteristics ?? [],
      attributes: draft.attributes,
      skills: draft.skills
    },
    metaArmor: draft.metaArmor ?? null,
    equipment: draft.equipment ?? [],
    progression: draft.progression ?? [],
    evolution: [],
    importedRecord: record
  };
}

function useResolvedCharacterData(characterId: string) {
  const [state, setState] = useState<CharacterState>({ status: "loading" });

  useEffect(() => {
    console.log("[Character Detail] Chargement du personnage", { characterId });

    if (characterId === mockCharacter.id) {
      setState({
        status: "ready",
        data: buildMockCharacterData()
      });
      return;
    }

    const importedCharacter = readImportedCharacterById(characterId);

    if (!importedCharacter) {
      const message = `Personnage introuvable pour l'identifiant "${characterId}".`;
      console.error("[Character Detail] " + message);
      setState({ status: "error", message });
      return;
    }

    console.log("[Character Detail] Personnage importé trouvé", importedCharacter);
    setState({
      status: "ready",
      data: buildImportedCharacterData(importedCharacter)
    });
  }, [characterId]);

  return state;
}

function CharacterErrorState({ message }: { message: string }) {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Personnage introuvable"
        description="La fiche demandée n'existe pas dans les données mockées ou dans les imports de session."
        action={
          <Button asChild variant="outline">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Retour à l'import
            </Link>
          </Button>
        }
      />
      <Card className="border-destructive/50">
        <CardContent className="flex items-start gap-3 p-4 text-destructive">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-sm">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function CharacterLoadingState({ title, description }: { title: string; description: string }) {
  return <PageHeading title={title} description={description} />;
}

function CharacterHeader({
  title,
  description,
  data,
  action
}: {
  title: string;
  description: string;
  data: ResolvedCharacterData;
  action?: ReactNode;
}) {
  return (
    <>
      <PageHeading title={title} description={description} action={action} />
      <AccessBanner access={playerReadOnlyAccess} />
      {data.source === "imported" && data.importedRecord ? (
        <Card>
          <CardContent className="grid gap-3 p-4 text-sm sm:grid-cols-3">
            <div className="rounded-md border p-3">
              <p className="text-muted-foreground">Source</p>
              <p className="mt-1 flex items-center gap-2 font-medium">
                <FileJson2 className="h-4 w-4" aria-hidden="true" />
                {data.importedRecord.sourceFileName ?? "Import collé"}
              </p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-muted-foreground">ID import</p>
              <p className="mt-1 font-medium">{data.importedRecord.id}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-muted-foreground">Acteur Foundry</p>
              <p className="mt-1 font-medium">{data.importedRecord.character.rawFoundryActorId ?? "Non fourni"}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}

function CharacterSummary({ data }: { data: ResolvedCharacterData }) {
  const { character } = data;

  return (
    <>
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{character.name}</CardTitle>
              {character.codename ? <Badge variant="secondary">{character.codename}</Badge> : null}
            </div>
            <CardDescription>
              {character.archetype || "Archétype non renseigné"}
              {character.rank ? ` · ${character.rank}` : ""}
              {character.order ? ` · ${character.order}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {character.quote ? (
              <blockquote className="border-l-4 border-primary pl-4 text-sm italic text-muted-foreground">
                {character.quote}
              </blockquote>
            ) : null}
            <p className="text-sm leading-6 text-muted-foreground">
              {character.biography || "Aucune biographie importée pour ce personnage."}
            </p>
            <div className="rounded-md bg-muted p-3 text-sm">
              <span className="font-medium">Source :</span>{" "}
              {data.source === "mock" ? character.playerName : "Import Foundry VTT"}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <GaugeCard label="Santé" gauge={character.health} />
          <GaugeCard label="Énergie" gauge={character.energy} tone="secondary" />
          <GaugeCard label="Espoir" gauge={character.hope} tone="accent" />
          <GaugeCard label="Trauma" gauge={character.trauma} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Aspects</CardTitle>
            <CardDescription>Libellés textuels détectés dans l'export Knight.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {character.aspects && character.aspects.length > 0 ? (
              character.aspects.map((aspect) => (
                <div key={aspect.key} className="rounded-md border p-4">
                  <p className="text-sm text-muted-foreground">{aspect.label}</p>
                  <p className="mt-2 font-semibold">{aspect.value}</p>
                </div>
              ))
            ) : (
              <EmptyStateCard message="Aucun aspect exploitable n'a été trouvé dans cet export." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Caractéristiques</CardTitle>
            <CardDescription>Valeurs numériques ou textuelles lues dans `system.characteristics` et variantes proches.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {character.characteristics && character.characteristics.length > 0 ? (
              character.characteristics.map((entry) => (
                <div key={entry.key} className="rounded-md border p-4">
                  <p className="text-sm text-muted-foreground">{entry.label}</p>
                  <p className="mt-2 text-2xl font-bold">{entry.value}</p>
                </div>
              ))
            ) : (
              <EmptyStateCard message="Aucune caractéristique n'a été trouvée dans cet export." />
            )}
          </CardContent>
        </Card>
      </section>

      <CharacterScores data={data} />
    </>
  );
}

function CharacterScores({ data }: { data: ResolvedCharacterData }) {
  const { character } = data;

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Attributs</CardTitle>
          <CardDescription>Profil opérationnel.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {character.attributes.map((attribute) => (
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
          {character.skills.map((skill) => (
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
  );
}

function EmptyStateCard({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground sm:col-span-2">
      {message}
    </div>
  );
}

export function CharacterDetailView({ characterId }: CharacterViewProps) {
  const state = useResolvedCharacterData(characterId);

  if (state.status === "loading") {
    return <CharacterLoadingState title="Personnage" description="Chargement de la fiche personnage." />;
  }

  if (state.status === "error") {
    return <CharacterErrorState message={state.message} />;
  }

  return (
    <div className="space-y-6">
      <CharacterHeader
        title="Personnage"
        description="Identité, ressources, aspects et scores principaux du chevalier."
        data={state.data}
      />
      <CharacterSummary data={state.data} />
    </div>
  );
}

export function CharacterMetaArmorView({ characterId }: CharacterViewProps) {
  const state = useResolvedCharacterData(characterId);

  if (state.status === "loading") {
    return <CharacterLoadingState title="Méta-armure" description="Chargement des données de méta-armure." />;
  }

  if (state.status === "error") {
    return <CharacterErrorState message={state.message} />;
  }

  const { data } = state;
  const armor = data.metaArmor;

  return (
    <div className="space-y-6">
      <CharacterHeader
        title="Méta-armure"
        description="Suivi des ressources d'armure, des emplacements et des systèmes embarqués."
        data={data}
      />

      {armor ? (
        <>
          <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader>
                <CardTitle>{armor.name}</CardTitle>
                <CardDescription>
                  {armor.frame} · {armor.generation}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <GaugeCard label="Armure" gauge={armor.armorPoints} />
                <GaugeCard label="Bouclier" gauge={armor.shieldPoints} tone="secondary" />
                <GaugeCard label="Overdrive" gauge={armor.overdrive} tone="accent" />
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
                {armor.slots.length > 0 ? (
                  armor.slots.map((slot) => (
                    <div key={slot.key} className="rounded-md border p-4">
                      <p className="text-sm text-muted-foreground">{slot.label}</p>
                      <p className="mt-2 font-semibold">{slot.occupiedBy ?? "Libre"}</p>
                    </div>
                  ))
                ) : (
                  <EmptyStateCard message="Aucun emplacement de méta-armure n'a été trouvé dans cet export." />
                )}
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
              {armor.systems.length > 0 ? (
                armor.systems.map((system) => (
                  <div key={system.id} className="rounded-md border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold">{system.name}</h3>
                      <Badge
                        variant={
                          system.status === "online" ? "secondary" : system.status === "limited" ? "accent" : "muted"
                        }
                      >
                        {systemStatusCopy[system.status]}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{system.description}</p>
                  </div>
                ))
              ) : (
                <EmptyStateCard message="Aucun système embarqué détaillé n'a été trouvé dans cet export." />
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Aucune donnée de méta-armure n'a été détectée pour ce personnage importé.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function CharacterEquipmentView({ characterId }: CharacterViewProps) {
  const state = useResolvedCharacterData(characterId);

  if (state.status === "loading") {
    return <CharacterLoadingState title="Équipement" description="Chargement de l'inventaire du personnage." />;
  }

  if (state.status === "error") {
    return <CharacterErrorState message={state.message} />;
  }

  const { data } = state;

  return (
    <div className="space-y-6">
      <CharacterHeader
        title="Équipement"
        description="Inventaire de séance avec les objets équipés, les consommables et les modules disponibles."
        data={data}
      />

      <section className="grid gap-4 md:grid-cols-2">
        {data.equipment.length > 0 ? (
          data.equipment.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <PackageCheck className="h-4 w-4" aria-hidden="true" />
                      {item.name}
                    </CardTitle>
                    <CardDescription>
                      {equipmentSlotCopy[item.slot]} · Quantité {item.quantity}
                    </CardDescription>
                  </div>
                  <Badge variant={item.equipped ? "secondary" : "muted"}>{item.equipped ? "Équipé" : "Réserve"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                {item.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              Aucun équipement exploitable n'a été détecté dans cet export.
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

export function CharacterProgressionView({ characterId }: CharacterViewProps) {
  const state = useResolvedCharacterData(characterId);

  if (state.status === "loading") {
    return <CharacterLoadingState title="Progression" description="Chargement de la progression du personnage." />;
  }

  if (state.status === "error") {
    return <CharacterErrorState message={state.message} />;
  }

  const { data } = state;
  const availableBlocks = data.progression.filter((block) => block.status === "available").length;
  const spentXp = data.progression.filter((block) => block.status === "spent").reduce((total, block) => total + block.costXp, 0);

  return (
    <div className="space-y-6">
      <CharacterHeader
        title="Progression"
        description="Améliorations +1 suivies par coût, disponibilité et validation."
        data={data}
      />

      {data.progression.length > 0 ? (
        <>
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

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {data.progression.map((block) => (
              <ProgressionBlockCard key={block.id} block={block} />
            ))}
          </section>
        </>
      ) : (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Aucune progression structurée n'a encore été importée pour ce personnage.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function CharacterEvolutionView({ characterId }: CharacterViewProps) {
  const state = useResolvedCharacterData(characterId);

  if (state.status === "loading") {
    return <CharacterLoadingState title="Évolution" description="Chargement de l'historique du personnage." />;
  }

  if (state.status === "error") {
    return <CharacterErrorState message={state.message} />;
  }

  const { data } = state;

  return (
    <div className="space-y-6">
      <CharacterHeader
        title="Évolution"
        description="Historique des améliorations appliquées et prochains jalons de campagne."
        data={data}
      />

      {data.evolution.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Journal d'évolution</CardTitle>
            <CardDescription>Chronologie des gains, modules et décisions marquantes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            {data.evolution.map((entry, index) => (
              <div key={entry.id}>
                <article className="grid gap-4 py-4 sm:grid-cols-[10rem_1fr_auto] sm:items-start">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    {entry.date}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{entry.title}</h3>
                      <Badge variant="outline">{evolutionKindCopy[entry.kind]}</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{entry.description}</p>
                  </div>
                  <Badge variant="secondary">{entry.xpCost} PX</Badge>
                </article>
                {index < data.evolution.length - 1 ? <Separator /> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Aucun historique d'évolution n'a été importé pour ce personnage.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
