import { Progress } from "@/components/ui/progress";
import type { Gauge } from "@/types/knight";

type GaugeCardProps = {
  label: string;
  gauge: Gauge;
  tone?: "primary" | "secondary" | "accent";
};

const toneClassName = {
  primary: "[&>div]:bg-primary",
  secondary: "[&>div]:bg-secondary",
  accent: "[&>div]:bg-accent"
};

export function GaugeCard({ label, gauge, tone = "primary" }: GaugeCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold">
          {gauge.current}/{gauge.max}
        </span>
      </div>
      <Progress className={toneClassName[tone]} value={gauge.current} max={gauge.max} />
    </div>
  );
}
