import { cn } from "@/lib/cn";
import type { AvatarTone } from "@/lib/types";

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

const toneMap: Record<AvatarTone, string> = {
  violet: "bg-accent-violet/14 text-accent-violet",
  lightBlue: "bg-accent-light-blue/14 text-accent-light-blue",
  green: "bg-accent-green/14 text-accent-green",
  amber: "bg-cautionary/14 text-cautionary",
  slate: "bg-fill-strong text-label-alternative",
};

interface AvatarProps {
  name: string;
  tone: AvatarTone;
  size?: keyof typeof sizeMap;
}

export function Avatar({ name, tone, size = "md" }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold",
        toneMap[tone],
        sizeMap[size],
      )}
    >
      {initials}
    </div>
  );
}
