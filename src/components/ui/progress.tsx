import * as React from "react";

import { cn } from "@/lib/utils";

export type ProgressProps = React.HTMLAttributes<HTMLDivElement> & {
  value: number;
  max?: number;
};

function Progress({ className, value, max = 100, ...props }: ProgressProps) {
  const percentage = max > 0 ? Math.min(Math.max((value / max) * 100, 0), 100) : 0;

  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)} {...props}>
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percentage}%` }} />
    </div>
  );
}

export { Progress };
