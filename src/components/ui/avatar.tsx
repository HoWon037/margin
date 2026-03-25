import { cn } from "@/lib/cn";
import type { AvatarTone } from "@/lib/types";

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-20 w-20 text-xl",
};

const imageSizes = {
  sm: "32px",
  md: "40px",
  lg: "48px",
  xl: "80px",
};

const toneMap: Record<AvatarTone, string> = {
  violet: "bg-accent-violet/14 text-accent-violet",
  indigo: "bg-primary/14 text-primary",
  blue: "bg-[rgba(46,110,255,0.14)] text-[#2e6eff]",
  lightBlue: "bg-accent-light-blue/14 text-accent-light-blue",
  teal: "bg-[rgba(38,166,154,0.14)] text-[#1f8f85]",
  green: "bg-accent-green/14 text-accent-green",
  lime: "bg-[rgba(132,184,62,0.16)] text-[#6e962a]",
  amber: "bg-cautionary/14 text-cautionary",
  coral: "bg-[rgba(255,120,88,0.14)] text-[#e56c4a]",
  rose: "bg-[rgba(232,94,132,0.14)] text-[#cc4d75]",
  slate: "bg-fill-strong text-label-alternative",
};

interface AvatarProps {
  name: string;
  tone: AvatarTone;
  avatarUrl?: string | null;
  size?: keyof typeof sizeMap;
}

export function Avatar({ name, tone, avatarUrl, size = "md" }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden rounded-full font-semibold",
        toneMap[tone],
        sizeMap[size],
      )}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={`${name} 프로필 사진`}
          className="h-full w-full object-cover"
          draggable={false}
          height={Number.parseInt(imageSizes[size], 10)}
          src={avatarUrl}
          width={Number.parseInt(imageSizes[size], 10)}
        />
      ) : (
        initials
      )}
    </div>
  );
}
