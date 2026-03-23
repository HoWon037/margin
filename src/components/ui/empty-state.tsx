import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  secondaryLabel,
  secondaryHref,
  className,
}: EmptyStateProps) {
  const hasActions = Boolean(
    (actionLabel && actionHref) || (secondaryLabel && secondaryHref),
  );

  return (
    <Card className={cn("space-y-4 text-center", className)}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-fill-normal">
        <div className="h-2.5 w-2.5 rounded-full bg-primary" />
      </div>
      <div className="space-y-2">
        <h3 className="type-headline text-label-strong">{title}</h3>
        <p className="mx-auto max-w-[34rem] type-body text-label-alternative">
          {description}
        </p>
      </div>
      {hasActions ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {actionLabel && actionHref ? (
            <Link className={buttonStyles({ variant: "primary", size: "md" })} href={actionHref}>
              {actionLabel}
            </Link>
          ) : null}
          {secondaryLabel && secondaryHref ? (
            <Link
              className={buttonStyles({ variant: "secondary", size: "md" })}
              href={secondaryHref}
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
