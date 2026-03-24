import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const toneMap = {
  neutral: "border border-line-solid bg-fill-normal text-label-normal",
  positive: "border border-positive/18 bg-positive/12 text-positive",
  cautionary: "border border-cautionary/18 bg-cautionary/12 text-cautionary",
  negative: "border border-negative/18 bg-negative/12 text-negative",
  primary: "border border-primary/18 bg-primary/12 text-primary",
  violet: "border border-accent-violet/18 bg-accent-violet/12 text-accent-violet",
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
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 type-caption",
        toneMap[tone],
        className,
      )}
      {...props}
    />
  );
}
