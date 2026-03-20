import { cn } from "@/lib/cn";
import { clampPercent } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
  tone?: "primary" | "positive" | "violet";
}

const toneMap = {
  primary: "bg-primary",
  positive: "bg-positive",
  violet: "bg-accent-violet",
};

export function ProgressBar({
  value,
  className,
  tone = "primary",
}: ProgressBarProps) {
  const width = clampPercent(value);

  return (
    <div
      className={cn("h-2 overflow-hidden rounded-full bg-fill-strong", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width]", toneMap[tone])}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
