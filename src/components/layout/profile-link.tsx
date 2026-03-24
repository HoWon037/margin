import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import type { UserSummary } from "@/lib/types";

interface ProfileLinkProps {
  user: UserSummary;
  href: string;
  className?: string;
}

export function ProfileLink({
  user,
  href,
  className,
}: ProfileLinkProps) {
  return (
    <Link
      className={cn(
        "chrome-surface inline-flex min-w-0 items-center gap-3 rounded-full border border-line-solid/90 px-2.5 py-2 shadow-xs transition-[background-color,border-color,box-shadow,transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:hover:bg-fill-alternative",
        className,
      )}
      href={href}
    >
      <Avatar
        avatarUrl={user.avatarUrl}
        name={user.nickname}
        size="sm"
        tone={user.avatarColor}
      />
      <div className="min-w-0">
        <p className="truncate type-label text-label-strong">{user.nickname}</p>
      </div>
    </Link>
  );
}
