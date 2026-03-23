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
      aria-label="진행률"
      className={cn("h-2 overflow-hidden rounded-full bg-fill-strong", className)}
      role="progressbar"
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round(width)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          toneMap[tone],
        )}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
