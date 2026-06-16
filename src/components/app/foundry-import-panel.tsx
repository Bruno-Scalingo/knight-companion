import { FileJson2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function FoundryImportPanel() {
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
        <form className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="foundry-file">Fichier JSON</Label>
            <Input id="foundry-file" type="file" accept="application/json,.json" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="foundry-json">Coller un export</Label>
            <Textarea id="foundry-json" placeholder='{"name":"Sillage","type":"character","system":{...}}' />
          </div>
          <Button type="button" className="w-fit">
            <Upload className="h-4 w-4" aria-hidden="true" />
            Analyser l'export
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
