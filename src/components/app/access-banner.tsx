import { LockKeyhole, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { AccessContext } from "@/lib/access";

type AccessBannerProps = {
  access: AccessContext;
};

export function AccessBanner({ access }: AccessBannerProps) {
  const Icon = access.readOnly ? LockKeyhole : ShieldCheck;

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
            <Icon className="h-4 w-4" aria-hidden={true} />
          </span>
          <div>
            <p className="text-sm font-semibold">{access.label}</p>
            <p className="text-sm text-muted-foreground">
              {access.readOnly
                ? "Les fiches sont consultables sans modification côté joueur."
                : "Les formulaires d'administration peuvent modifier les données."}
            </p>
          </div>
        </div>
        <Badge variant={access.readOnly ? "muted" : "secondary"}>{access.readOnly ? "Lecture seule" : "Édition"}</Badge>
      </CardContent>
    </Card>
  );
}
