import Link from "next/link";
import { ArrowLeft, Database, ShieldCheck, UserCog } from "lucide-react";

import { AccessBanner } from "@/components/app/access-banner";
import { FoundryImportPanel } from "@/components/app/foundry-import-panel";
import { PageHeading } from "@/components/app/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminAccess } from "@/lib/access";

export default function AdminPage() {
  return (
    <main className="min-h-screen surface-grid">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button asChild variant="outline">
            <Link href="/personnage">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Retour à la fiche
            </Link>
          </Button>
        </div>

        <PageHeading
          title="Administration"
          description="Gestion des accès, des imports Foundry VTT Knight et de la base de campagne."
        />
        <div className="space-y-6">
          <AccessBanner access={adminAccess} />

          <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5" aria-hidden="true" />
                  Accès
                </CardTitle>
                <CardDescription>Droits actifs pour les profils de campagne.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">Joueur</p>
                      <p className="text-sm text-muted-foreground">Consultation de sa fiche uniquement.</p>
                    </div>
                    <Badge variant="muted">Lecture seule</Badge>
                  </div>
                </div>
                <div className="rounded-md border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">Administrateur</p>
                      <p className="text-sm text-muted-foreground">Édition, import, progression et journal.</p>
                    </div>
                    <Badge variant="secondary">Édition</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" aria-hidden="true" />
                  Connexion données
                </CardTitle>
                <CardDescription>Base PostgreSQL utilisée par Prisma.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="database-url">DATABASE_URL</Label>
                  <Input id="database-url" value="postgresql://.../knight_companion?schema=public" readOnly />
                </div>
                <div className="rounded-md bg-muted p-4 text-sm leading-6 text-muted-foreground">
                  <ShieldCheck className="mb-2 h-4 w-4 text-secondary" aria-hidden="true" />
                  Les données de campagne couvrent les utilisateurs, personnages, méta-armures, équipements, blocs +1,
                  historique d'évolution et imports Foundry.
                </div>
              </CardContent>
            </Card>
          </section>

          <FoundryImportPanel />
        </div>
      </div>
    </main>
  );
}
