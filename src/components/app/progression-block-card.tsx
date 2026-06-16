import { CheckCircle2, CircleDashed, LockKeyhole } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProgressionBlock } from "@/types/knight";

type ProgressionBlockCardProps = {
  block: ProgressionBlock;
};

const statusCopy = {
  available: "Disponible",
  spent: "Dépensé",
  locked: "Verrouillé"
};

const statusIcon = {
  available: CircleDashed,
  spent: CheckCircle2,
  locked: LockKeyhole
};

export function ProgressionBlockCard({ block }: ProgressionBlockCardProps) {
  const Icon = statusIcon[block.status];

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base">{block.title}</CardTitle>
          <p className="mt-1 text-sm capitalize text-muted-foreground">{block.category}</p>
        </div>
        <Badge variant={block.status === "spent" ? "secondary" : block.status === "locked" ? "muted" : "accent"}>
          <Icon className="mr-1 h-3.5 w-3.5" aria-hidden={true} />
          {statusCopy[block.status]}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
          <span className="text-sm text-muted-foreground">Valeur du bloc</span>
          <span className="font-semibold">+{block.bonusValue}</span>
        </div>
        <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
          <span className="text-sm text-muted-foreground">Coût</span>
          <span className="font-semibold">{block.costXp} PX</span>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{block.note}</p>
      </CardContent>
    </Card>
  );
}
