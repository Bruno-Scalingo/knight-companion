"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft } from "lucide-react";

import { PageHeading } from "@/components/app/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { readImportedCharacter } from "@/lib/imported-character-store";

export function ImportedCharacterView() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    console.log("[Foundry Import] Redirection depuis l'ancienne route /personnage/importe");
    const importedRecord = readImportedCharacter();

    if (!importedRecord) {
      console.error("[Foundry Import] Aucun personnage importé disponible en session");
      setErrorMessage("Aucun personnage importé n'est disponible. Relancez un import depuis l'administration.");
      return;
    }

    const characterRoute = `/personnages/${importedRecord.id}` as Route;
    console.log("[Foundry Import] Redirection vers la fiche personnage", {
      characterId: importedRecord.id,
      characterRoute
    });
    router.replace(characterRoute);
  }, [router]);

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

  return (
    <div className="space-y-6">
      <PageHeading title="Redirection" description="Ouverture de la fiche personnage importée." />
    </div>
  );
}
