"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Shield, Swords, TrendingUp, UserRound, WandSparkles } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const defaultCharacterRoute = "/personnages/char-ariane" as Route;

const tabDefinitions: Array<{
  key: string;
  suffix: "" | "/meta-armure" | "/equipement" | "/progression" | "/evolution";
  label: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}> = [
  { key: "personnage", suffix: "", label: "Personnage", icon: UserRound },
  { key: "meta-armure", suffix: "/meta-armure", label: "Méta-armure", icon: Shield },
  { key: "equipement", suffix: "/equipement", label: "Équipement", icon: Swords },
  { key: "progression", suffix: "/progression", label: "Progression", icon: TrendingUp },
  { key: "evolution", suffix: "/evolution", label: "Évolution", icon: WandSparkles }
];

type DashboardShellProps = {
  children: ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter(Boolean);
  const characterId = pathSegments[0] === "personnages" && pathSegments[1] ? pathSegments[1] : null;
  const characterBaseRoute = (characterId ? `/personnages/${characterId}` : defaultCharacterRoute) as Route;
  const tabs = tabDefinitions.map((tab) => ({
    ...tab,
    href: `${characterBaseRoute}${tab.suffix}` as Route
  }));

  return (
    <div className="min-h-screen surface-grid">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b bg-background/95 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Knight RPG</p>
            <h1 className="text-2xl font-bold tracking-normal">Compagnon de chevalier</h1>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin">
              <ClipboardList className="h-4 w-4" aria-hidden={true} />
              Administration
            </Link>
          </Button>
        </header>

        <nav className="sticky top-0 z-10 -mx-4 overflow-x-auto border-b bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex min-w-max gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active =
                tab.suffix === ""
                  ? pathname === tab.href
                  : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden={true} />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <main className="flex-1 py-6">{children}</main>
      </div>
    </div>
  );
}
