import { cn } from "@/lib/cn";
import type { WeeklyReadDay } from "@/lib/types";

interface ReadingDaysStripProps {
  days: WeeklyReadDay[];
  compact?: boolean;
  hideLabels?: boolean;
  className?: string;
}

export function ReadingDaysStrip({
  days,
  compact = false,
  hideLabels = false,
  className,
}: ReadingDaysStripProps) {
  return (
    <div className={cn("grid grid-cols-7 gap-2", className)}>
      {days.map((day) => (
        <div
          key={day.date}
          className={cn("text-center", hideLabels ? "" : "space-y-1")}
        >
          {!hideLabels ? (
            <p
              className={cn(
                "type-caption",
                day.read ? "text-label-strong" : "text-label-assistive",
              )}
            >
              {day.label}
            </p>
          ) : null}
          <div
            className={cn(
              "relative overflow-hidden rounded-full",
              compact ? "h-1.5" : "h-2",
              day.isToday && "ring-2 ring-primary/10",
            )}
          >
            <div className="absolute inset-0 bg-fill-strong" />
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition",
                day.read ? "w-full bg-primary" : "w-full bg-line-solid/80",
              )}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
