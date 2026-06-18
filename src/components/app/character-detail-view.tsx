"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Cpu,
  ImagePlus,
  Loader2,
  PackageCheck
} from "lucide-react";

import { AccessBanner } from "@/components/app/access-banner";
import { GaugeCard } from "@/components/app/gauge-card";
import { PageHeading } from "@/components/app/page-heading";
import { ProgressionBlockCard } from "@/components/app/progression-block-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { adminAccess, canEdit, playerReadOnlyAccess } from "@/lib/access";
import type { AccessContext } from "@/lib/access";
import { normalizeFoundryKnightActor } from "@/lib/foundry-import";
import { decodeHtmlEntities } from "@/lib/html-entities";
import {
  readImportedCharacterById,
  updateImportedCharacterPortrait
} from "@/lib/imported-character-store";
import {
  mockCharacter,
  mockEquipment,
  mockEvolutionEntries,
  mockMetaArmor,
  mockProgressionBlocks
} from "@/lib/mock-data";
import type {
  AspectGroup,
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

const allowedPortraitTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const maxPortraitSize = 2 * 1024 * 1024;

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

function buildImportedCharacterData(record: ImportedKnightCharacter): ResolvedCharacterData {
  const draft = {
    ...record.character,
    ...normalizeFoundryKnightActor(record.actor)
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
      heroism: draft.heroism ?? { current: 0, max: 0 },
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

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Le portrait n'a pas pu être lu."));
    });
    reader.addEventListener("error", () => reject(reader.error ?? new Error("Erreur de lecture du portrait.")));
    reader.readAsDataURL(file);
  });
}

function CharacterSummary({ data, access }: { data: ResolvedCharacterData; access: AccessContext }) {
  const { character } = data;
  const aspectGroups = buildFallbackAspectGroups(character);
  const fallbackBiography = character.biography || "Aucune biographie importée pour ce personnage.";
  const [portraitUrl, setPortraitUrl] = useState(character.portraitUrl ?? "");
  const [portraitMessage, setPortraitMessage] = useState("");
  const [portraitError, setPortraitError] = useState("");
  const [isPortraitUploading, setIsPortraitUploading] = useState(false);
  const canUploadPortrait = canEdit(access);

  useEffect(() => {
    setPortraitUrl(character.portraitUrl ?? "");
    setPortraitMessage("");
    setPortraitError("");
  }, [character.id, character.portraitUrl]);

  async function handlePortraitChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    setPortraitMessage("");
    setPortraitError("");

    if (!allowedPortraitTypes.has(file.type)) {
      const message = "Format non supporté. Utilise une image JPEG, PNG, WebP ou GIF.";
      console.error("[Portrait Import] " + message, { type: file.type });
      setPortraitError(message);
      return;
    }

    if (file.size > maxPortraitSize) {
      const message = "Image trop lourde. Limite actuelle: 2 Mo.";
      console.error("[Portrait Import] " + message, { size: file.size });
      setPortraitError(message);
      return;
    }

    setIsPortraitUploading(true);

    try {
      console.log("[Portrait Import] Lecture du fichier portrait", { name: file.name, type: file.type, size: file.size });
      const dataUrl = await readFileAsDataUrl(file);
      let portraitSource = dataUrl;
      let persistedInDatabase = false;

      try {
        const formData = new FormData();
        formData.append("portrait", file);

        const response = await fetch(`/api/characters/${character.id}/portrait`, {
          method: "POST",
          body: formData
        });

        if (response.ok) {
          const payload = (await response.json()) as { portraitUrl?: string };
          portraitSource = payload.portraitUrl ? `${payload.portraitUrl}?v=${Date.now()}` : dataUrl;
          persistedInDatabase = true;
          console.log("[Portrait Import] Portrait sauvegardé en base", { characterId: character.id });
        } else {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          console.warn("[Portrait Import] Sauvegarde base indisponible, fallback session", {
            status: response.status,
            error: payload?.error
          });
        }
      } catch (error) {
        console.warn("[Portrait Import] Sauvegarde base indisponible, fallback session", error);
      }

      if (data.source === "imported" && data.importedRecord) {
        updateImportedCharacterPortrait(data.importedRecord.id, {
          url: portraitSource,
          fileName: file.name,
          mimeType: file.type
        });
      }

      setPortraitUrl(portraitSource);
      setPortraitMessage(
        persistedInDatabase
          ? "Portrait importé et sauvegardé en base."
          : "Portrait importé pour cette session. La sauvegarde base sera utilisée dès que le personnage existera en PostgreSQL."
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue pendant l'import du portrait.";
      console.error("[Portrait Import] " + message, error);
      setPortraitError(message);
    } finally {
      setIsPortraitUploading(false);
      event.currentTarget.value = "";
    }
  }

  return (
    <>
      <section className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="aspect-[3/4] overflow-hidden rounded-md border bg-muted">
              {portraitUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={portraitUrl}
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
            {canUploadPortrait ? (
              <div className="space-y-2">
                <Label htmlFor={`portrait-${character.id}`} className="flex items-center gap-2">
                  <ImagePlus className="h-4 w-4" aria-hidden={true} />
                  Importer une photo
                </Label>
                <Input
                  id={`portrait-${character.id}`}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  disabled={isPortraitUploading}
                  onChange={handlePortraitChange}
                />
                {isPortraitUploading ? (
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden={true} />
                    Import du portrait en cours.
                  </p>
                ) : null}
                {portraitMessage ? <p className="text-xs text-muted-foreground">{portraitMessage}</p> : null}
                {portraitError ? <p className="text-xs font-medium text-destructive">{portraitError}</p> : null}
              </div>
            ) : null}
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
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <IdentityField label="Nom" value={character.name} />
            <IdentityField label="Surnom" value={character.callsign} />
            <IdentityField label="Âge" value={character.age} />
            <IdentityField label="Archétype" value={character.archetype} />
            <IdentityField label="Section" value={character.section || character.order} />
            <IdentityField label="Haut-fait" value={character.feat} className="sm:col-span-2 xl:col-span-2" />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <Card>
          <CardHeader>
            <CardTitle>Ressources</CardTitle>
            <CardDescription>Valeurs actuelles du personnage.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <GaugeCard label="Santé" gauge={character.health} />
            <GaugeCard label="Espoir" gauge={character.hope} tone="accent" />
            <GaugeCard label="Héroïsme" gauge={character.heroism} tone="secondary" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Défenses</CardTitle>
            <CardDescription>Scores fixes lus depuis la fiche.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2 lg:grid-cols-1">
            <NumericStat label="Égide" value={character.aegis} />
            <NumericStat label="Défense" value={character.defense} />
            <NumericStat label="Réaction" value={character.reaction} />
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
                    aspect.characteristics.map((characteristic) => (
                      <div key={characteristic.key} className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex min-w-0 flex-wrap items-center gap-1 text-muted-foreground">
                          <span>{characteristic.label}</span>
                          {typeof characteristic.overdrive === "number" && characteristic.overdrive > 0 ? (
                            <span className="font-medium text-foreground">(+ {characteristic.overdrive} OD)</span>
                          ) : null}
                        </span>
                        <span className="font-semibold">{characteristic.value}</span>
                      </div>
                    ))
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

      <section className="grid gap-4 lg:grid-cols-[1fr_20rem]">
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
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Repères</CardTitle>
          <CardDescription>Langues et distinctions.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <TagList title="Langues" values={character.languages} emptyLabel="Aucune langue importée." />
          <TagList title="Distinctions" values={character.distinctions} emptyLabel="Aucune distinction importée." />
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
      <CharacterSummary data={state.data} access={access} />
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

const progressionOrderStoragePrefix = "knight-companion:progression-order";

function readStoredProgressionOrder(characterId: string) {
  const rawOrder = window.localStorage.getItem(`${progressionOrderStoragePrefix}:${characterId}`);

  if (!rawOrder) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawOrder);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch (error) {
    console.error("[Progression] Impossible de relire l'ordre manuel", error);
    return [];
  }
}

function applyStoredProgressionOrder(characterId: string, blocks: ProgressionBlock[]) {
  const storedOrder = readStoredProgressionOrder(characterId);

  if (storedOrder.length === 0) {
    return blocks;
  }

  const orderIndex = new Map(storedOrder.map((id, index) => [id, index]));

  return [...blocks].sort((first, second) => {
    const firstIndex = orderIndex.get(first.id);
    const secondIndex = orderIndex.get(second.id);

    if (firstIndex !== undefined && secondIndex !== undefined) {
      return firstIndex - secondIndex;
    }

    if (firstIndex !== undefined) {
      return -1;
    }

    if (secondIndex !== undefined) {
      return 1;
    }

    return 0;
  });
}

function saveProgressionOrder(characterId: string, blocks: ProgressionBlock[]) {
  window.localStorage.setItem(
    `${progressionOrderStoragePrefix}:${characterId}`,
    JSON.stringify(blocks.map((block) => block.id))
  );
}

function moveProgressionBlock(blocks: ProgressionBlock[], fromIndex: number, toIndex: number) {
  const nextBlocks = [...blocks];
  const [movedBlock] = nextBlocks.splice(fromIndex, 1);

  if (!movedBlock) {
    return blocks;
  }

  nextBlocks.splice(toIndex, 0, movedBlock);
  return nextBlocks;
}

function ProgressionTimeline({
  characterId,
  progression,
  access
}: {
  characterId: string;
  progression: ProgressionBlock[];
  access: AccessContext;
}) {
  const [orderedProgression, setOrderedProgression] = useState<ProgressionBlock[]>([]);
  const canReorder = canEdit(access);
  const spentXp = orderedProgression.reduce((total, block) => total + block.costXp, 0);
  const sourceEntries = new Set(orderedProgression.map((block) => block.sourceId ?? block.id)).size;

  useEffect(() => {
    setOrderedProgression(applyStoredProgressionOrder(characterId, progression));
  }, [characterId, progression]);

  function handleMove(fromIndex: number, toIndex: number) {
    setOrderedProgression((currentBlocks) => {
      const nextBlocks = moveProgressionBlock(currentBlocks, fromIndex, toIndex);
      saveProgressionOrder(characterId, nextBlocks);
      console.log("[Progression] Ordre manuel sauvegardé", {
        characterId,
        order: nextBlocks.map((block) => block.id)
      });
      return nextBlocks;
    });
  }

  if (orderedProgression.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          Aucune progression structurée n'a encore été importée pour ce personnage.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Blocs +1</CardDescription>
            <CardTitle>{orderedProgression.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Entrées Foundry</CardDescription>
            <CardTitle>{sourceEntries}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>PX dépensés</CardDescription>
            <CardTitle>{spentXp}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="space-y-3">
        {orderedProgression.map((block, index) => (
          <ProgressionBlockCard
            key={block.id}
            block={block}
            canReorder={canReorder}
            isFirst={index === 0}
            isLast={index === orderedProgression.length - 1}
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
    return <CharacterLoadingState title="Progression" description="Chargement de la progression du personnage." />;
  }

  if (state.status === "error") {
    return <CharacterErrorState message={state.message} />;
  }

  const { data } = state;
  const access = adminAccess;

  return (
    <div className="space-y-6">
      <CharacterHeader
        title="Progression"
        description="Blocs +1 ordonnés chronologiquement pour suivre l'évolution du chevalier."
        data={data}
        access={access}
      />

      <ProgressionTimeline characterId={characterId} progression={data.progression} access={access} />
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
