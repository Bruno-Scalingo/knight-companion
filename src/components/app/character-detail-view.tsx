"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Cpu,
  PackageCheck
} from "lucide-react";

import { AccessBanner } from "@/components/app/access-banner";
import { GaugeCard } from "@/components/app/gauge-card";
import { PageHeading } from "@/components/app/page-heading";
import { ProgressionBlockCard } from "@/components/app/progression-block-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { adminAccess, canEdit, playerReadOnlyAccess } from "@/lib/access";
import type { AccessContext } from "@/lib/access";
import { normalizeFoundryKnightActor } from "@/lib/foundry-import";
import { decodeHtmlEntities } from "@/lib/html-entities";
import { readImportedCharacterById } from "@/lib/imported-character-store";
import {
  mockCharacter,
  mockEquipment,
  mockEvolutionProgressionBlocks,
  mockMetaArmor,
  mockProgressionBlocks
} from "@/lib/mock-data";
import type {
  AspectGroup,
  EquipmentItem,
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

type ResolvedCharacterData = {
  source: "mock" | "imported";
  character: KnightCharacter;
  metaArmor: MetaArmor | null;
  equipment: EquipmentItem[];
  progression: ProgressionBlock[];
  evolutionProgression: ProgressionBlock[];
  availableXp: number;
  availableGp: number;
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
    evolutionProgression: mockEvolutionProgressionBlocks,
    availableXp: 0,
    availableGp: 0
  };
}

function decodeText(value: string | undefined) {
  return decodeHtmlEntities(value ?? "");
}

function decodeTextList(values: string[] | undefined) {
  return (values ?? []).map((value) => decodeHtmlEntities(value)).filter((value) => value.length > 0);
}

function decodeAspectGroups(groups: AspectGroup[] | undefined): AspectGroup[] {
  return (groups ?? []).map((group) => ({
    ...group,
    label: decodeHtmlEntities(group.label),
    value: typeof group.value === "string" ? decodeHtmlEntities(group.value) : group.value,
    characteristics: group.characteristics.map((characteristic) => ({
      ...characteristic,
      label: decodeHtmlEntities(characteristic.label),
      value: typeof characteristic.value === "string" ? decodeHtmlEntities(characteristic.value) : characteristic.value
    }))
  }));
}

function normalizeHeroismGauge(gauge: KnightCharacter["heroism"]) {
  return {
    current: Math.min(gauge.current, 6),
    max: 6
  };
}

function buildImportedCharacterData(record: ImportedKnightCharacter): ResolvedCharacterData {
  const normalizedDraft = normalizeFoundryKnightActor(record.actor);
  const draft = {
    ...normalizedDraft,
    ...record.character,
    portraitUrl: record.character.portraitUrl ?? normalizedDraft.portraitUrl,
    metaArmor:
      normalizedDraft.metaArmor && record.character.metaArmor?.imageUrl
        ? {
            ...normalizedDraft.metaArmor,
            imageUrl: record.character.metaArmor.imageUrl
          }
        : normalizedDraft.metaArmor,
    progression: record.character.progression ?? normalizedDraft.progression,
    evolutionProgression: record.character.evolutionProgression ?? normalizedDraft.evolutionProgression,
    availableXp: record.character.availableXp ?? normalizedDraft.availableXp,
    availableGp: record.character.availableGp ?? normalizedDraft.availableGp
  };

  return {
    source: "imported",
    character: {
      id: record.id,
      name: decodeText(draft.name),
      callsign: decodeText(draft.callsign ?? draft.codename),
      portraitUrl: draft.portraitUrl,
      age: decodeText(draft.age),
      codename: decodeText(draft.codename),
      playerName: "Import Foundry",
      archetype: decodeText(draft.archetype),
      section: decodeText(draft.section ?? draft.order),
      blazon: decodeText(draft.blazon),
      blazonDetail: decodeText(draft.blazonDetail),
      feat: decodeText(draft.feat),
      rank: decodeText(draft.rank),
      order: decodeText(draft.order),
      quote: decodeText(draft.quote),
      biography: decodeText(draft.biography),
      description: decodeText(draft.description),
      history: decodeText(draft.history ?? draft.biography),
      motivations: decodeText(draft.motivations),
      primaryMotivation: decodeText(draft.primaryMotivation),
      secondaryMotivations: decodeTextList(draft.secondaryMotivations),
      languages: decodeTextList(draft.languages),
      distinctions: decodeTextList(draft.distinctions),
      health: draft.health ?? { current: 0, max: 0 },
      hope: draft.hope ?? { current: 0, max: 0 },
      heroism: normalizeHeroismGauge(draft.heroism ?? { current: 0, max: 6 }),
      aegis: draft.aegis ?? 0,
      defense: draft.defense ?? 0,
      reaction: draft.reaction ?? 0,
      energy: draft.energy ?? { current: 0, max: 0 },
      trauma: draft.trauma ?? { current: 0, max: 0 },
      aspectGroups: decodeAspectGroups(draft.aspectGroups),
      aspects: draft.aspects ?? [],
      characteristics: draft.characteristics ?? [],
      attributes: draft.attributes ?? [],
      skills: draft.skills ?? []
    },
    metaArmor: draft.metaArmor ?? null,
    equipment: draft.equipment ?? [],
    progression: draft.progression ?? [],
    evolutionProgression: draft.evolutionProgression ?? [],
    availableXp: draft.availableXp ?? 0,
    availableGp: draft.availableGp ?? 0,
    importedRecord: record
  };
}

async function fetchPersistedImportedCharacter(characterId: string) {
  try {
    const response = await fetch(`/api/characters/${characterId}`);

    if (!response.ok) {
      console.warn("[Character Detail] Personnage absent de la base", { characterId, status: response.status });
      return null;
    }

    return (await response.json()) as ImportedKnightCharacter;
  } catch (error) {
    console.warn("[Character Detail] Lecture serveur impossible", error);
    return null;
  }
}

function useResolvedCharacterData(characterId: string) {
  const [state, setState] = useState<CharacterState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    console.log("[Character Detail] Chargement du personnage", { characterId });

    if (characterId === mockCharacter.id) {
      setState({
        status: "ready",
        data: buildMockCharacterData()
      });
      return;
    }

    async function resolveImportedCharacter() {
      const importedCharacter = readImportedCharacterById(characterId) ?? (await fetchPersistedImportedCharacter(characterId));

      if (cancelled) {
        return;
      }

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
    }

    void resolveImportedCharacter();

    return () => {
      cancelled = true;
    };
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
  action,
  access = playerReadOnlyAccess
}: {
  title: string;
  description: string;
  data: ResolvedCharacterData;
  action?: ReactNode;
  access?: AccessContext;
}) {
  return (
    <>
      <PageHeading title={title} description={description} action={action} />
      <AccessBanner access={access} />
    </>
  );
}

const aspectOrder = ["chair", "bete", "bête", "machine", "dame", "masque"];

function sortAspectGroups(groups: AspectGroup[]) {
  return [...groups].sort((first, second) => {
    const firstIndex = aspectOrder.indexOf(first.key.toLowerCase());
    const secondIndex = aspectOrder.indexOf(second.key.toLowerCase());

    return (firstIndex === -1 ? 99 : firstIndex) - (secondIndex === -1 ? 99 : secondIndex);
  });
}

function buildFallbackAspectGroups(character: KnightCharacter): AspectGroup[] {
  if (character.aspectGroups && character.aspectGroups.length > 0) {
    return sortAspectGroups(character.aspectGroups);
  }

  if (character.attributes.length === 0) {
    return [];
  }

  return character.attributes.map((attribute) => ({
    key: attribute.key,
    label: attribute.label,
    value: attribute.value,
    characteristics: character.skills
      .filter((skill) => skill.attribute.toLowerCase() === attribute.label.toLowerCase())
      .map((skill) => ({
        key: skill.key,
        label: skill.label,
        value: skill.value
      }))
  }));
}

function uniqueNames(values: string[]) {
  return Array.from(new Set(values.map((value) => decodeHtmlEntities(value.trim())).filter(Boolean)));
}

function normalizeSourceType(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/s$/, "");
}

function pickEquipmentNamesBySourceType(equipment: EquipmentItem[], sourceTypes: string[]) {
  const expectedTypes = new Set(sourceTypes.map(normalizeSourceType));

  return uniqueNames(
    equipment
      .filter((item) => item.sourceType && expectedTypes.has(normalizeSourceType(item.sourceType)))
      .map((item) => item.name)
  );
}

function isInventoryEquipmentItem(item: EquipmentItem) {
  if (item.sourceType) {
    const sourceType = normalizeSourceType(item.sourceType);
    return sourceType === "arme" || sourceType === "weapon" || sourceType === "module";
  }

  return item.slot === "weapon" || item.slot === "module";
}

function formatModuleType(moduleType: string | undefined) {
  if (!moduleType) {
    return "";
  }

  return `Module ${decodeHtmlEntities(moduleType).toLowerCase()}`;
}

function mergeOverdriveEquipmentItems(items: EquipmentItem[]) {
  const mergedItems = new Map<string, EquipmentItem>();

  for (const item of items) {
    const key = (item.overdriveKey ?? item.name).trim().toLowerCase();
    const existingItem = mergedItems.get(key);

    if (!existingItem) {
      mergedItems.set(key, {
        ...item,
        tags: [...item.tags]
      });
      continue;
    }

    mergedItems.set(key, {
      ...existingItem,
      level: (existingItem.level ?? 0) + (item.level ?? 0),
      quantity: Math.max(existingItem.quantity, item.quantity),
      equipped: existingItem.equipped || item.equipped,
      tags: uniqueNames([...existingItem.tags, ...item.tags]),
      description:
        existingItem.description === item.description
          ? existingItem.description
          : `${existingItem.description} ${item.description}`.trim()
    });
  }

  return Array.from(mergedItems.values());
}

function EquipmentCard({ item }: { item: EquipmentItem }) {
  const moduleTypeLabel = item.slot === "module" ? formatModuleType(item.moduleType) : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PackageCheck className="h-4 w-4" aria-hidden="true" />
          {item.name}
        </CardTitle>
        <CardDescription>
          {moduleTypeLabel || equipmentSlotCopy[item.slot]}
          {item.slot === "module" && item.level ? ` · Niveau ${item.level}` : ""}
          {item.range ? ` · Portée ${item.range}` : ""}
          {item.quantity > 1 ? ` · Quantité ${item.quantity}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
        {item.slot === "module" && item.slotUsage && item.slotUsage.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {item.slotUsage.map((slotUsage) => (
              <Badge key={slotUsage} variant="secondary">
                {slotUsage}
              </Badge>
            ))}
          </div>
        ) : null}
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
  );
}

function EquipmentSection({ title, items, emptyLabel }: { title: string; items: EquipmentItem[]; emptyLabel: string }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-normal text-muted-foreground">{title}</h2>
      {items.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <EquipmentCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">{emptyLabel}</CardContent>
        </Card>
      )}
    </section>
  );
}

function WeaponColumns({
  contactWeapons,
  rangedWeapons
}: {
  contactWeapons: EquipmentItem[];
  rangedWeapons: EquipmentItem[];
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-normal text-muted-foreground">ARMES</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <EquipmentSection
          title="ARMES DE CONTACT"
          items={contactWeapons}
          emptyLabel="Aucune arme de contact détectée dans cet export."
        />
        <EquipmentSection
          title="ARMES À DISTANCE"
          items={rangedWeapons}
          emptyLabel="Aucune arme à distance détectée dans cet export."
        />
      </div>
    </section>
  );
}

function normalizeCharacteristicKey(key: string) {
  return key
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function calculateMetaArmorDefenseScore(aspectGroups: AspectGroup[], keys: string[], fallback: number) {
  const wantedKeys = new Set(keys.map(normalizeCharacteristicKey));
  const scores = aspectGroups
    .flatMap((aspect) => aspect.characteristics)
    .filter((characteristic) => wantedKeys.has(normalizeCharacteristicKey(characteristic.key)))
    .map((characteristic) => {
      const score = typeof characteristic.value === "number" ? characteristic.value : Number(characteristic.value);
      const overdrive = typeof characteristic.overdrive === "number" ? characteristic.overdrive : 0;

      return Number.isFinite(score) ? score + overdrive : null;
    })
    .filter((score): score is number => typeof score === "number");

  return scores.length > 0 ? Math.max(...scores) : fallback;
}

function CharacterSummary({ data }: { data: ResolvedCharacterData }) {
  const { character } = data;
  const aspectGroups = buildFallbackAspectGroups(character);
  const metaArmorDefense = calculateMetaArmorDefenseScore(
    aspectGroups,
    ["hargne", "combat", "instinct"],
    character.defense
  );
  const metaArmorReaction = calculateMetaArmorDefenseScore(
    aspectGroups,
    ["tir", "savoir", "technique"],
    character.reaction
  );
  const fallbackBiography = character.biography || "Aucune biographie importée pour ce personnage.";
  const advantages = pickEquipmentNamesBySourceType(data.equipment, ["avantage"]);
  const disadvantages = pickEquipmentNamesBySourceType(data.equipment, ["inconvenient", "désavantage"]);
  const injuries = pickEquipmentNamesBySourceType(data.equipment, ["blessure"]);

  return (
    <>
      <section className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <Card>
          <CardContent className="p-4">
            <div className="aspect-[3/4] overflow-hidden rounded-md border bg-muted">
              {character.portraitUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={character.portraitUrl}
                  alt={`Portrait de ${character.name}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center">
                  <div>
                    <p className="text-5xl font-bold text-muted-foreground">
                      {(character.callsign || character.name).slice(0, 2).toUpperCase()}
                    </p>
                    <p className="mt-3 text-sm text-muted-foreground">Portrait non importé</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{character.name}</CardTitle>
              {character.callsign ? <Badge variant="secondary">{character.callsign}</Badge> : null}
            </div>
            <CardDescription>{character.archetype || "Archétype non renseigné"}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <IdentityField label="Nom" value={character.name} />
            <IdentityField label="Surnom" value={character.callsign} />
            <IdentityField label="Âge" value={character.age} />
            <IdentityField label="Archétype" value={character.archetype} />
            <IdentityField label="Section" value={character.section || character.order} />
            <IdentityField label="Haut-fait" value={character.feat} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_18rem_18rem]">
        <Card>
          <CardHeader>
            <CardTitle>Ressources</CardTitle>
            <CardDescription>Valeurs actuelles du personnage.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <GaugeCard label="Santé" gauge={character.health} />
            <GaugeCard label="Espoir" gauge={character.hope} tone="accent" />
            <GaugeCard label="Héroïsme" gauge={character.heroism} tone="secondary" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Défenses</CardTitle>
            <CardDescription>Scores de défense sans la Méta-Armure</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2 lg:grid-cols-1">
            <NumericStat label="Égide" value={character.aegis} />
            <NumericStat label="Défense" value={character.defense} />
            <NumericStat label="Réaction" value={character.reaction} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Défenses (en Méta-Armure)</CardTitle>
            <CardDescription>Scores de défense avec la Méta-Armure</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2 lg:grid-cols-1">
            <NumericStat label="Égide" value={character.aegis} />
            <NumericStat label="Défense" value={metaArmorDefense} />
            <NumericStat label="Réaction" value={metaArmorReaction} />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Aspects et caractéristiques</CardTitle>
          <CardDescription>Les cinq aspects Knight avec leurs caractéristiques associées.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-5">
          {aspectGroups.length > 0 ? (
            aspectGroups.map((aspect) => (
              <div key={aspect.key} className="rounded-md border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{aspect.label}</p>
                    <p className="mt-1 text-3xl font-bold">{aspect.value}</p>
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="space-y-2">
                  {aspect.characteristics.length > 0 ? (
                    <div className="grid grid-cols-[1fr_2.5rem_2.5rem] gap-x-2 gap-y-2 text-sm">
                      <span className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                        Carac.
                      </span>
                      <span className="text-right text-xs font-medium uppercase tracking-normal text-muted-foreground">
                        Score
                      </span>
                      <span className="text-right text-xs font-medium uppercase tracking-normal text-muted-foreground">
                        OD
                      </span>
                      {aspect.characteristics.map((characteristic) => (
                        <div key={characteristic.key} className="contents">
                          <span className="min-w-0 text-muted-foreground">{characteristic.label}</span>
                          <span className="text-right font-semibold">{characteristic.value}</span>
                          <span className="text-right font-semibold">
                            {typeof characteristic.overdrive === "number" && characteristic.overdrive > 0
                              ? characteristic.overdrive
                              : "-"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Caractéristiques non importées.</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <EmptyStateCard message="Aucun aspect exploitable n'a été trouvé dans cet export." />
          )}
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Blason et motivations</CardTitle>
            <CardDescription>Engagements personnels et symbole du chevalier.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <BiographyBlock
              title={`Blason${character.blazon ? ` : ${character.blazon}` : ""}`}
              value={character.blazonDetail}
            />
            <TagList
              title="Motivation principale"
              values={character.primaryMotivation ? [character.primaryMotivation] : []}
              emptyLabel="Aucune motivation principale importée."
            />
            <TagList
              title="Motivations secondaires"
              values={character.secondaryMotivations}
              emptyLabel="Aucune motivation secondaire importée."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Repères</CardTitle>
            <CardDescription>Langues, distinctions, avantages, désavantages et blessures.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <TagList title="Langues" values={character.languages} emptyLabel="Aucune langue importée." />
            <TagList title="Distinctions" values={character.distinctions} emptyLabel="Aucune distinction importée." />
            <TagList title="Avantages" values={advantages} emptyLabel="Aucun avantage importé." />
            <TagList title="Désavantages" values={disadvantages} emptyLabel="Aucun désavantage importé." />
            <TagList title="Blessures" values={injuries} emptyLabel="Aucune blessure importée." />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Biographie</CardTitle>
          <CardDescription>Description et histoire du chevalier.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
          <BiographyBlock title="Description" value={character.description || fallbackBiography} />
          <BiographyBlock title="Histoire" value={character.history || fallbackBiography} />
        </CardContent>
      </Card>
    </>
  );
}

function IdentityField({ label, value, className }: { label: string; value?: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">{label}</p>
      <p className="mt-1 min-h-6 text-sm font-semibold">{value || "Non renseigné"}</p>
    </div>
  );
}

function NumericStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-3 text-center lg:text-left">
      <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function BiographyBlock({ title, value }: { title: string; value?: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1">{value || "Non renseigné."}</p>
    </div>
  );
}

function HtmlContent({ value, className }: { value?: string; className?: string }) {
  const html = decodeHtmlEntities(value ?? "").trim();

  if (!html) {
    return <p className={className}>Non renseigné.</p>;
  }

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{
        __html: html
      }}
    />
  );
}

function TagList({ title, values, emptyLabel }: { title: string; values: string[]; emptyLabel: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {values.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {values.map((value) => (
            <Badge key={value} variant="outline">
              {value}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">{emptyLabel}</p>
      )}
    </div>
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

  const access = state.data.source === "imported" ? adminAccess : playerReadOnlyAccess;

  return (
    <div className="space-y-6">
      <CharacterHeader
        title="Personnage"
        description="Identité, ressources, aspects et scores principaux du chevalier."
        data={state.data}
        access={access}
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
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle>{armor.name}</CardTitle>
                    <p className="text-sm font-semibold text-muted-foreground">
                      {/generation/i.test(armor.generation) ? armor.generation : `Génération ${armor.generation}`}
                    </p>
                  </div>
                  <div className="overflow-hidden rounded-md border bg-muted/30">
                    {armor.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={armor.imageUrl}
                        alt={`Illustration de la méta-armure ${armor.name}`}
                        className="h-[28rem] w-full object-contain object-center"
                      />
                    ) : (
                      <div className="flex h-[28rem] items-center justify-center px-6 text-center">
                        <div>
                          <p className="text-3xl font-bold text-muted-foreground">{armor.name}</p>
                          <p className="mt-3 text-sm text-muted-foreground">Illustration de méta-armure non importée</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>

            <div className="space-y-4 self-start">
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
                        <p className="mt-2 font-semibold">
                          {typeof slot.available === "number" && typeof slot.total === "number"
                            ? `${slot.available} / ${slot.total}`
                            : slot.occupiedBy ?? "Libre"}
                        </p>
                      </div>
                    ))
                  ) : (
                    <EmptyStateCard message="Aucun emplacement de méta-armure n'a été trouvé dans cet export." />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Protection</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <GaugeCard label="Armure" gauge={armor.armorPoints} />
                  <GaugeCard
                    label="Champ de Force"
                    gauge={{ current: armor.shieldPoints.max, max: armor.shieldPoints.max }}
                    tone="secondary"
                    valueOnly
                  />
                  <GaugeCard label="Énergie" gauge={data.character.energy} tone="accent" />
                </CardContent>
              </Card>
            </div>
          </section>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" aria-hidden="true" />
                Capacités
              </CardTitle>
              <CardDescription>Capacités spéciales de la Méta-armure</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {armor.systems.length > 0 ? (
                armor.systems.map((system) => (
                  <div key={system.id} className="rounded-md border p-4">
                    <h3 className="font-semibold">{system.name}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{system.description}</p>
                  </div>
                ))
              ) : (
                <EmptyStateCard message="Aucune capacité spéciale détaillée n'a été trouvée dans cet export." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" aria-hidden="true" />
                Évolution
              </CardTitle>
              <CardDescription>Paliers d'évolution de la Méta-armure</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {armor.evolutions.length > 0 ? (
                armor.evolutions.map((evolution) => (
                  <div key={evolution.id} className="rounded-md border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold">{evolution.threshold} PG</h3>
                      <Badge variant={evolution.applied ? "secondary" : "outline"}>
                        {evolution.applied ? "Activée" : "Non activée"}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{evolution.description}</p>
                  </div>
                ))
              ) : (
                <EmptyStateCard message="Aucun palier d'évolution n'a été trouvé dans cet export." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <HtmlContent
                value={armor.frame}
                className="text-sm leading-6 text-muted-foreground [&_p]:m-0 [&_p+*]:mt-3 [&_ul]:m-0 [&_ul]:pl-5 [&_ol]:m-0 [&_ol]:pl-5"
              />
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
  const visibleEquipment = data.equipment.filter(isInventoryEquipmentItem);
  const weapons = visibleEquipment.filter((item) => {
    const sourceType = item.sourceType ? normalizeSourceType(item.sourceType) : "";
    return sourceType === "arme" || sourceType === "weapon" || item.slot === "weapon";
  });
  const contactWeapons = weapons.filter((item) => item.weaponType === "contact");
  const rangedWeapons = weapons.filter((item) => item.weaponType === "distance" || !item.weaponType);
  const modules = visibleEquipment.filter((item) => {
    const sourceType = item.sourceType ? normalizeSourceType(item.sourceType) : "";
    return (sourceType === "module" || item.slot === "module") && !item.isOverdriveModule;
  });
  const overdriveModules = mergeOverdriveEquipmentItems(
    visibleEquipment.filter((item) => {
      const sourceType = item.sourceType ? normalizeSourceType(item.sourceType) : "";
      return (sourceType === "module" || item.slot === "module") && item.isOverdriveModule;
    })
  );

  return (
    <div className="space-y-6">
      <CharacterHeader
        title="Équipement"
        description="Armes et modules disponibles pour la séance."
        data={data}
      />

      <WeaponColumns contactWeapons={contactWeapons} rangedWeapons={rangedWeapons} />
      <EquipmentSection title="MODULES" items={modules} emptyLabel="Aucun module exploitable détecté dans cet export." />
      <EquipmentSection
        title="OVERDRIVES"
        items={overdriveModules}
        emptyLabel="Aucun module d'overdrive détecté dans cet export."
      />
    </div>
  );
}

function readStoredBlockOrder(storageKeyPrefix: string, characterId: string) {
  const rawOrder = window.localStorage.getItem(`${storageKeyPrefix}:${characterId}`);

  if (!rawOrder) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawOrder);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch (error) {
    console.error("[Timeline] Impossible de relire l'ordre manuel", error);
    return [];
  }
}

function applyBlockOrder(blocks: ProgressionBlock[], orderedIds: string[]) {
  if (orderedIds.length === 0) {
    return blocks;
  }

  const blocksById = new Map(blocks.map((block) => [block.id, block]));
  const orderedStoredBlocks = orderedIds
    .map((id) => blocksById.get(id))
    .filter((block): block is ProgressionBlock => Boolean(block));
  const storedIds = new Set(orderedIds);
  const newBlocks = blocks.filter((block) => !storedIds.has(block.id));

  return [...orderedStoredBlocks, ...newBlocks];
}

function saveBlockOrder(storageKeyPrefix: string, characterId: string, blocks: ProgressionBlock[]) {
  window.localStorage.setItem(
    `${storageKeyPrefix}:${characterId}`,
    JSON.stringify(blocks.map((block) => block.id))
  );
}

async function fetchBlockOrder(orderApiPath: string) {
  const response = await fetch(orderApiPath);

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Lecture de l'ordre impossible.");
  }

  const payload = (await response.json()) as { blockIds?: unknown };
  return Array.isArray(payload.blockIds) ? payload.blockIds.filter((id): id is string => typeof id === "string") : [];
}

async function saveBlockOrderToServer(orderApiPath: string, blocks: ProgressionBlock[]) {
  const response = await fetch(orderApiPath, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      blockIds: blocks.map((block) => block.id)
    })
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Sauvegarde de l'ordre impossible.");
  }
}

function moveBlock(blocks: ProgressionBlock[], fromIndex: number, toIndex: number) {
  const nextBlocks = [...blocks];
  const [movedBlock] = nextBlocks.splice(fromIndex, 1);

  if (!movedBlock) {
    return blocks;
  }

  nextBlocks.splice(toIndex, 0, movedBlock);
  return nextBlocks;
}

function OrderedBlocksTimeline({
  characterId,
  blocks,
  availablePoints,
  access,
  useSharedOrder,
  storageKeyPrefix,
  orderApiPath,
  countLabel,
  availableLabel,
  spentLabel,
  emptyMessage,
  logPrefix
}: {
  characterId: string;
  blocks: ProgressionBlock[];
  availablePoints: number;
  access: AccessContext;
  useSharedOrder: boolean;
  storageKeyPrefix: string;
  orderApiPath: string;
  countLabel: string;
  availableLabel: string;
  spentLabel: string;
  emptyMessage: string;
  logPrefix: string;
}) {
  const [orderedBlocks, setOrderedBlocks] = useState<ProgressionBlock[]>([]);
  const [orderStatus, setOrderStatus] = useState<"idle" | "loading" | "saving" | "saved" | "error">("idle");
  const [orderMessage, setOrderMessage] = useState<string | null>(null);
  const canReorder = canEdit(access);
  const spentPoints = orderedBlocks.reduce((total, block) => total + block.costXp, 0);

  useEffect(() => {
    let cancelled = false;
    const localOrder = readStoredBlockOrder(storageKeyPrefix, characterId);
    const locallyOrderedBlocks = applyBlockOrder(blocks, localOrder);

    setOrderedBlocks(locallyOrderedBlocks);
    setOrderMessage(null);

    if (!useSharedOrder) {
      setOrderStatus("idle");
      return;
    }

    setOrderStatus("loading");

    async function loadSharedBlockOrder() {
      try {
        const sharedOrder = await fetchBlockOrder(orderApiPath);

        if (cancelled) {
          return;
        }

        if (sharedOrder.length > 0) {
          setOrderedBlocks(applyBlockOrder(blocks, sharedOrder));
          setOrderStatus("idle");
          return;
        }

        if (canReorder && localOrder.length > 0) {
          await saveBlockOrderToServer(orderApiPath, locallyOrderedBlocks);
          console.log(`[${logPrefix}] Ordre local migré en base`, { characterId, order: localOrder });

          if (!cancelled) {
            setOrderStatus("saved");
            setOrderMessage("Ordre sauvegardé en base.");
          }

          return;
        }

        setOrderStatus("idle");
      } catch (error) {
        console.warn(`[${logPrefix}] Lecture de l'ordre partagé impossible, fallback local`, error);

        if (!cancelled) {
          setOrderStatus("error");
          setOrderMessage(
            error instanceof Error
              ? error.message
              : "L'ordre partagé n'a pas pu être chargé. L'ordre local reste affiché."
          );
        }
      }
    }

    void loadSharedBlockOrder();

    return () => {
      cancelled = true;
    };
  }, [blocks, canReorder, characterId, logPrefix, orderApiPath, storageKeyPrefix, useSharedOrder]);

  function handleMove(fromIndex: number, toIndex: number) {
    setOrderedBlocks((currentBlocks) => {
      const nextBlocks = moveBlock(currentBlocks, fromIndex, toIndex);
      saveBlockOrder(storageKeyPrefix, characterId, nextBlocks);
      console.log(`[${logPrefix}] Ordre manuel sauvegardé`, {
        characterId,
        order: nextBlocks.map((block) => block.id)
      });

      if (!useSharedOrder) {
        return nextBlocks;
      }

      setOrderStatus("saving");
      setOrderMessage("Sauvegarde de l'ordre en cours.");

      void saveBlockOrderToServer(orderApiPath, nextBlocks)
        .then(() => {
          setOrderStatus("saved");
          setOrderMessage("Ordre sauvegardé en base.");
        })
        .catch((error) => {
          console.error(`[${logPrefix}] Sauvegarde serveur impossible`, error);
          setOrderStatus("error");
          setOrderMessage(
            error instanceof Error
              ? error.message
              : "L'ordre n'a pas pu être sauvegardé en base. Les autres visiteurs ne verront pas ce changement."
          );
        });

      return nextBlocks;
    });
  }

  if (orderedBlocks.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          {emptyMessage}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>{countLabel}</CardDescription>
            <CardTitle>{orderedBlocks.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{availableLabel}</CardDescription>
            <CardTitle>{availablePoints}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{spentLabel}</CardDescription>
            <CardTitle>{spentPoints}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      {orderMessage ? (
        <div
          className={`rounded-md border p-3 text-sm ${
            orderStatus === "error"
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-secondary/40 bg-secondary/10 text-secondary"
          }`}
        >
          {orderMessage}
        </div>
      ) : null}

      <section className="space-y-3">
        {orderedBlocks.map((block, index) => (
          <ProgressionBlockCard
            key={block.id}
            block={block}
            canReorder={canReorder}
            isFirst={index === 0}
            isLast={index === orderedBlocks.length - 1}
            position={index + 1}
            onMoveUp={() => handleMove(index, index - 1)}
            onMoveDown={() => handleMove(index, index + 1)}
          />
        ))}
      </section>
    </>
  );
}

export function CharacterProgressionView({ characterId }: CharacterViewProps) {
  const state = useResolvedCharacterData(characterId);

  if (state.status === "loading") {
    return <CharacterLoadingState title="Expérience" description="Chargement de l'expérience du personnage." />;
  }

  if (state.status === "error") {
    return <CharacterErrorState message={state.message} />;
  }

  const { data } = state;
  const access = adminAccess;

  return (
    <div className="space-y-6">
      <CharacterHeader
        title="Expérience"
        description="Progression chronologique de l'expérience du chevalier."
        data={data}
        access={access}
      />

      <OrderedBlocksTimeline
        characterId={characterId}
        blocks={data.progression}
        availablePoints={data.availableXp}
        access={access}
        useSharedOrder={data.source === "imported"}
        storageKeyPrefix="knight-companion:progression-order"
        orderApiPath={`/api/characters/${characterId}/progression-order`}
        countLabel="Nombre de progressions"
        availableLabel="XP Disponible"
        spentLabel="XP Dépensés"
        emptyMessage="Aucune progression structurée n'a encore été importée pour ce personnage."
        logPrefix="Progression"
      />
    </div>
  );
}

export function CharacterEvolutionView({ characterId }: CharacterViewProps) {
  const state = useResolvedCharacterData(characterId);

  if (state.status === "loading") {
    return <CharacterLoadingState title="Évolution" description="Chargement des évolutions de la méta-armure." />;
  }

  if (state.status === "error") {
    return <CharacterErrorState message={state.message} />;
  }

  const { data } = state;
  const access = adminAccess;

  return (
    <div className="space-y-6">
      <CharacterHeader
        title="Évolution"
        description="Progression chronologique de la gloire et des évolutions de la méta-armure."
        data={data}
        access={access}
      />

      <OrderedBlocksTimeline
        characterId={characterId}
        blocks={data.evolutionProgression}
        availablePoints={data.availableGp}
        access={access}
        useSharedOrder={data.source === "imported"}
        storageKeyPrefix="knight-companion:evolution-order"
        orderApiPath={`/api/characters/${characterId}/evolution-order`}
        countLabel="Nombre d'évolutions"
        availableLabel="PG Disponible"
        spentLabel="PG Dépensés"
        emptyMessage="Aucune évolution de méta-armure n'a encore été importée pour ce personnage."
        logPrefix="Evolution"
      />
    </div>
  );
}
