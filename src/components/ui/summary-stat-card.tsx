import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/cn";

interface SummaryStatCardProps {
  label: string;
  value: string;
  note?: string;
  progress?: number;
  progressTone?: "primary" | "positive" | "violet";
  className?: string;
}

export function SummaryStatCard({
  label,
  value,
  note,
  progress,
  progressTone = "primary",
  className,
}: SummaryStatCardProps) {
  return (
    <Card className={cn("space-y-3", className)}>
      <div className="space-y-1">
        <p className="type-caption uppercase text-label-assistive">{label}</p>
        <p className="type-heading2 text-label-strong">{value}</p>
      </div>
      {typeof progress === "number" ? (
        <ProgressBar tone={progressTone} value={progress} />
      ) : null}
      {note ? <p className="type-label-reading text-label-alternative">{note}</p> : null}
    </Card>
  );
}
