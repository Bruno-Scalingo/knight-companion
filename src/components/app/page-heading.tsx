import type { ReactNode } from "react";

type PageHeadingProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function PageHeading({ title, description, action }: PageHeadingProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="max-w-3xl">
        <h2 className="text-2xl font-bold tracking-normal">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
