"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { AlertCircle, CheckCircle2, FileJson2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { normalizeFoundryKnightActor, validateFoundryKnightActor } from "@/lib/foundry-import";
import { saveImportedCharacter } from "@/lib/imported-character-store";

const importedCharacterRoute = "/personnage/importe" as Route;

function readFileAsText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Le fichier n'a pas pu être lu comme texte."));
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error("Erreur inconnue pendant la lecture du fichier."));
    };

    reader.readAsText(file);
  });
}

export function FoundryImportPanel() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedJson, setPastedJson] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    console.log("[Foundry Import] Fichier sélectionné", file?.name ?? "aucun fichier");
    setSelectedFile(file);
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  async function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsImporting(true);

    console.log("[Foundry Import] Démarrage de l'import", {
      fileName: selectedFile?.name,
      hasPastedJson: pastedJson.trim().length > 0
    });

    try {
      const rawJson = pastedJson.trim().length > 0 ? pastedJson : selectedFile ? await readFileAsText(selectedFile) : "";

      if (rawJson.trim().length === 0) {
        throw new Error("Sélectionnez un fichier JSON ou collez un export Foundry avant d'importer.");
      }

      console.log("[Foundry Import] JSON brut chargé", { length: rawJson.length });

      let parsedJson: unknown;

      try {
        parsedJson = JSON.parse(rawJson);
      } catch (error) {
        console.error("[Foundry Import] Erreur de parsing JSON", error);
        throw new Error("Le fichier sélectionné n'est pas un JSON valide.");
      }

      console.log("[Foundry Import] JSON parsé", parsedJson);

      const validation = validateFoundryKnightActor(parsedJson);

      if (!validation.valid) {
        console.error("[Foundry Import] Validation Foundry échouée", validation.message, parsedJson);
        throw new Error(validation.message);
      }

      const character = normalizeFoundryKnightActor(validation.actor);

      saveImportedCharacter({
        importedAt: new Date().toISOString(),
        sourceFileName: selectedFile?.name,
        actor: validation.actor,
        character
      });

      console.log("[Foundry Import] Import validé et stocké en session", character);
      setSuccessMessage(`Import prêt pour ${character.name}. Redirection en cours.`);
      router.push(importedCharacterRoute);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue pendant l'import.";

      console.error("[Foundry Import] Import impossible", error);
      setErrorMessage(message);
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileJson2 className="h-5 w-5" aria-hidden="true" />
          Import Foundry VTT Knight
        </CardTitle>
        <CardDescription>Chargement d'un acteur Knight exporté depuis Foundry VTT.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleImport}>
          <div className="grid gap-2">
            <Label htmlFor="foundry-file">Fichier JSON</Label>
            <Input id="foundry-file" type="file" accept="application/json,.json" onChange={handleFileChange} />
            {selectedFile ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-secondary" aria-hidden="true" />
                Fichier sélectionné : <span className="font-medium text-foreground">{selectedFile.name}</span>
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="foundry-json">Coller un export</Label>
            <Textarea
              id="foundry-json"
              placeholder='{"name":"Sillage","type":"knight","system":{...}}'
              value={pastedJson}
              onChange={(event) => {
                console.log("[Foundry Import] Export collé modifié", { length: event.target.value.length });
                setPastedJson(event.target.value);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
            />
          </div>
          {errorMessage ? (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>{errorMessage}</p>
            </div>
          ) : null}
          {successMessage ? (
            <div className="flex items-start gap-2 rounded-md border border-secondary/40 bg-secondary/10 p-3 text-sm text-secondary">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>{successMessage}</p>
            </div>
          ) : null}
          <Button type="submit" className="w-fit" disabled={isImporting || (!selectedFile && pastedJson.trim().length === 0)}>
            <Upload className="h-4 w-4" aria-hidden="true" />
            {isImporting ? "Import en cours" : "Importer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
