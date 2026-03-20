import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const toneMap = {
  neutral: "bg-fill-normal text-label-alternative",
  positive: "bg-positive/12 text-positive",
  cautionary: "bg-cautionary/12 text-cautionary",
  negative: "bg-negative/12 text-negative",
  primary: "bg-primary/12 text-primary",
  violet: "bg-accent-violet/12 text-accent-violet",
};

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: keyof typeof toneMap;
}

export function Chip({
  className,
  tone = "neutral",
  ...props
}: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 type-caption",
        toneMap[tone],
        className,
      )}
      {...props}
    />
  );
}
