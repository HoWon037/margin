import { cn } from "@/lib/cn";
import type { ToastTone } from "@/lib/types";

const toneMap: Record<ToastTone, { container: string; title: string }> = {
  primary: {
    container: "chrome-surface border-primary/22",
    title: "text-primary",
  },
  positive: {
    container: "chrome-surface border-positive/22",
    title: "text-positive",
  },
  cautionary: {
    container: "chrome-surface border-cautionary/22",
    title: "text-cautionary",
  },
  negative: {
    container: "chrome-surface border-negative/22",
    title: "text-negative",
  },
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
  const isAssertive = tone === "negative" || tone === "cautionary";

  return (
    <div
      aria-atomic="true"
      aria-live={isAssertive ? "assertive" : "polite"}
      className={cn(
        "rounded-lg border px-4 py-3 shadow-xs",
        toneMap[tone].container,
        className,
      )}
      role={isAssertive ? "alert" : "status"}
    >
      <p className={cn("type-label", toneMap[tone].title)}>{title}</p>
      {description ? (
        <p className="mt-1 type-caption text-label-alternative">{description}</p>
      ) : null}
    </div>
  );
}
