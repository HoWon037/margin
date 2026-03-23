import { cn } from "@/lib/cn";

interface TabSwitchProps {
  items: Array<{
    label: string;
    value: string;
  }>;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function TabSwitch({
  items,
  value,
  onChange,
  className,
}: TabSwitchProps) {
  return (
    <div
      aria-label="전환"
      className={cn("grid w-full border-b border-line-solid", className)}
      role="tablist"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((item) => {
        const active = item.value === value;

        return (
          <button
            aria-selected={active}
            key={item.value}
            className={cn(
              "relative inline-flex h-10 min-w-0 items-center justify-center pb-3 text-center type-label transition",
              active
                ? "text-label-strong after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:rounded-full after:bg-label-strong"
                : "text-label-alternative md:hover:text-label-strong",
            )}
            onClick={() => onChange(item.value)}
            role="tab"
            tabIndex={active ? 0 : -1}
            type="button"
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
