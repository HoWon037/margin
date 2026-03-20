import { cn } from "@/lib/cn";
import type { ToastTone } from "@/lib/types";

const toneMap: Record<ToastTone, string> = {
  primary: "border-primary/15 bg-primary/8 text-primary",
  positive: "border-positive/15 bg-positive/8 text-positive",
  cautionary: "border-cautionary/15 bg-cautionary/8 text-cautionary",
  negative: "border-negative/15 bg-negative/8 text-negative",
};

interface ToastProps {
  title: string;
  description?: string;
  tone?: ToastTone;
  className?: string;
}

export function Toast({
  title,
  description,
  tone = "primary",
  className,
}: ToastProps) {
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 shadow-xs",
        toneMap[tone],
        className,
      )}
      role="status"
    >
      <p className="type-label">{title}</p>
      {description ? <p className="mt-1 type-caption">{description}</p> : null}
    </div>
  );
}
