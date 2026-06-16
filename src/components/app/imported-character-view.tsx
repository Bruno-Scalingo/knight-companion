"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, FileJson2 } from "lucide-react";

import { PageHeading } from "@/components/app/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { readImportedCharacter } from "@/lib/imported-character-store";
import type { ImportedKnightCharacter } from "@/types/knight";

export function ImportedCharacterView() {
  const [record, setRecord] = useState<ImportedKnightCharacter | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    console.log("[Foundry Import] Lecture du personnage importé depuis la session");
    const importedRecord = readImportedCharacter();

    if (!importedRecord) {
      console.error("[Foundry Import] Aucun personnage importé disponible en session");
      setErrorMessage("Aucun personnage importé n'est disponible. Relancez un import depuis l'administration.");
      return;
    }

    console.log("[Foundry Import] Personnage importé chargé", importedRecord);
    setRecord(importedRecord);
  }, []);

  if (errorMessage) {
    return (
      <div className="space-y-6">
        <PageHeading
          title="Personnage importé"
          description="Résultat du dernier import Foundry VTT Knight."
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
            <p className="text-sm">{errorMessage}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="space-y-6">
        <PageHeading title="Personnage importé" description="Chargement de l'import Foundry VTT Knight." />
      </div>
    );
  }

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

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attributs importés</CardTitle>
            <CardDescription>Valeurs lues depuis `system.attributes`.</CardDescription>
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
            <CardTitle>Compétences importées</CardTitle>
            <CardDescription>Valeurs lues depuis `system.skills`.</CardDescription>
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
    </div>
  );
}
