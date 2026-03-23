import Link from "next/link";
import { cn } from "@/lib/cn";

interface TabsProps {
  items: Array<{
    label: string;
    href: string;
    active?: boolean;
  }>;
  className?: string;
}

export function Tabs({ items, className }: TabsProps) {
  return (
    <div
      className={cn(
        "grid w-full border-b border-line-solid",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          aria-current={item.active ? "page" : undefined}
          className={cn(
            "relative inline-flex h-9 min-w-0 items-center justify-center overflow-hidden px-1.5 pb-2.5 text-center whitespace-nowrap text-[12px] leading-none font-medium transition sm:h-10 sm:px-2 sm:pb-3 sm:text-[13px] sm:leading-5",
            item.active
              ? "text-label-strong after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:rounded-full after:bg-label-strong"
              : "text-label-alternative md:hover:text-label-strong",
          )}
          href={item.href}
          title={item.label}
        >
          <span className="block truncate">{item.label}</span>
        </Link>
      ))}
    </div>
  );
}
