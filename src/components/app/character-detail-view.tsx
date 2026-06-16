"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, FileJson2 } from "lucide-react";

import { AccessBanner } from "@/components/app/access-banner";
import { GaugeCard } from "@/components/app/gauge-card";
import { PageHeading } from "@/components/app/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { playerReadOnlyAccess } from "@/lib/access";
import { readImportedCharacterById } from "@/lib/imported-character-store";
import { mockCharacter } from "@/lib/mock-data";
import type { ImportedKnightCharacter, KnightCharacter } from "@/types/knight";

type CharacterDetailState =
  | {
      status: "loading";
    }
  | {
      status: "error";
      message: string;
    }
  | {
      status: "mock";
      character: KnightCharacter;
    }
  | {
      status: "imported";
      record: ImportedKnightCharacter;
    };

type CharacterDetailViewProps = {
  characterId: string;
};

export function CharacterDetailView({ characterId }: CharacterDetailViewProps) {
  const [state, setState] = useState<CharacterDetailState>({ status: "loading" });

  useEffect(() => {
    console.log("[Character Detail] Chargement du personnage", { characterId });

    if (characterId === mockCharacter.id) {
      console.log("[Character Detail] Personnage mock trouvé", mockCharacter);
      setState({ status: "mock", character: mockCharacter });
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
    setState({ status: "imported", record: importedCharacter });
  }, [characterId]);

  if (state.status === "loading") {
    return <PageHeading title="Personnage" description="Chargement de la fiche personnage." />;
  }

  if (state.status === "error") {
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
            <p className="text-sm">{state.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state.status === "imported") {
    return <ImportedCharacterDetail record={state.record} />;
  }

  return <MockCharacterDetail character={state.character} />;
}

function MockCharacterDetail({ character }: { character: KnightCharacter }) {
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
              <CardTitle>{character.name}</CardTitle>
              <Badge variant="secondary">{character.codename}</Badge>
            </div>
            <CardDescription>
              {character.archetype} · {character.rank} · {character.order}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <blockquote className="border-l-4 border-primary pl-4 text-sm italic text-muted-foreground">
              {character.quote}
            </blockquote>
            <p className="text-sm leading-6 text-muted-foreground">{character.biography}</p>
            <div className="rounded-md bg-muted p-3 text-sm">
              <span className="font-medium">Joueur :</span> {character.playerName}
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

      <CharacterScores attributes={character.attributes} skills={character.skills} />
    </div>
  );
}

function ImportedCharacterDetail({ record }: { record: ImportedKnightCharacter }) {
  const { actor, character, sourceFileName, importedAt } = record;

  return (
    <div className="space-y-6">
      <PageHeading
        title="Personnage importé"
        description="Données normalisées depuis l'export Foundry VTT Knight."
        action={
          <Button asChild variant="outline">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Importer un autre fichier
            </Link>
          </Button>
        }
      />
      <AccessBanner access={playerReadOnlyAccess} />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{character.name}</CardTitle>
            {character.codename ? <Badge variant="secondary">{character.codename}</Badge> : null}
            <Badge variant="outline">type {actor.type}</Badge>
          </div>
          <CardDescription>
            {character.archetype || "Archétype non renseigné"} · {character.rank || "Rang non renseigné"}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-md border p-4">
            <p className="text-muted-foreground">Fichier source</p>
            <p className="mt-1 font-medium">{sourceFileName ?? "Import collé"}</p>
          </div>
          <div className="rounded-md border p-4">
            <p className="text-muted-foreground">Importé le</p>
            <p className="mt-1 font-medium">{new Date(importedAt).toLocaleString("fr-FR")}</p>
          </div>
          <div className="rounded-md border p-4">
            <p className="text-muted-foreground">ID Foundry</p>
            <p className="mt-1 font-medium">{character.rawFoundryActorId ?? "Non fourni"}</p>
          </div>
          <div className="rounded-md border p-4">
            <p className="text-muted-foreground">Source</p>
            <p className="mt-1 flex items-center gap-2 font-medium">
              <FileJson2 className="h-4 w-4" aria-hidden="true" />
              Stockage de session
            </p>
          </div>
        </CardContent>
      </Card>

      <CharacterScores attributes={character.attributes} skills={character.skills} />
    </div>
  );
}

function CharacterScores({
  attributes,
  skills
}: {
  attributes: KnightCharacter["attributes"];
  skills: KnightCharacter["skills"];
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Attributs</CardTitle>
          <CardDescription>Profil opérationnel.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {attributes.map((attribute) => (
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
          {skills.map((skill) => (
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
