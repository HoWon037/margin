import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  elevated?: boolean;
}

export function Card({
  className,
  interactive = false,
  elevated = false,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "card-surface rounded-[20px] border border-line-solid/90 p-5 shadow-xs sm:p-6",
        elevated && "bg-bg-elevated shadow-sm",
        interactive &&
          "transition md:hover:border-line-normal md:hover:shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
