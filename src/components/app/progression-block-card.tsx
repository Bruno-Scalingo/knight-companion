import { ArrowDown, ArrowUp, CheckCircle2, CircleDashed, GripVertical, LockKeyhole } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProgressionBlock } from "@/types/knight";

type ProgressionBlockCardProps = {
  block: ProgressionBlock;
  canReorder?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  position?: number;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
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

const categoryCopy = {
  aspect: "Aspect",
  attribut: "Attribut",
  competence: "Caractéristique",
  armure: "Armure",
  ressource: "Ressource"
} as const;

export function ProgressionBlockCard({
  block,
  canReorder = false,
  isFirst = false,
  isLast = false,
  position,
  onMoveUp,
  onMoveDown
}: ProgressionBlockCardProps) {
  const Icon = statusIcon[block.status];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-semibold">
            {position ?? "•"}
          </span>
          <GripVertical className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" aria-hidden={true} />
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{block.title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{categoryCopy[block.category]}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant={block.status === "spent" ? "secondary" : block.status === "locked" ? "muted" : "accent"}>
            <Icon className="mr-1 h-3.5 w-3.5" aria-hidden={true} />
            {statusCopy[block.status]}
          </Badge>
          {canReorder ? (
            <div className="flex gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onMoveUp}
                disabled={isFirst}
                aria-label={`Monter ${block.title}`}
              >
                <ArrowUp className="h-4 w-4" aria-hidden={true} />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onMoveDown}
                disabled={isLast}
                aria-label={`Descendre ${block.title}`}
              >
                <ArrowDown className="h-4 w-4" aria-hidden={true} />
              </Button>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 p-4 pt-0 text-sm sm:grid-cols-[1fr_auto_auto] sm:items-center">
        <p className="leading-6 text-muted-foreground">{block.note}</p>
        {block.unitTotal && block.unitTotal > 1 ? (
          <Badge variant="outline">
            Bloc {block.unitIndex}/{block.unitTotal}
          </Badge>
        ) : null}
        {typeof block.sourceCostXp === "number" && block.sourceCostXp !== 0 ? (
          <Badge variant="muted">
            {block.sourceCostXp} {block.pointsLabel ?? "XP"} source
          </Badge>
        ) : null}
      </CardContent>
    </Card>
  );
}
