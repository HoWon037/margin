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
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.value === value),
  );

  return (
    <div
      aria-label="전환"
      className={cn(
        "chrome-surface relative grid w-full rounded-full border border-line-solid p-1",
        className,
      )}
      role="tablist"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      <div
        aria-hidden="true"
        className="absolute top-1 bottom-1 left-1 rounded-full bg-fill-strong shadow-xs transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          width: `calc((100% - 8px) / ${items.length})`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />
      {items.map((item) => {
        const active = item.value === value;

        return (
          <button
            aria-selected={active}
            key={item.value}
            className={cn(
              "relative z-10 inline-flex h-10 min-w-0 items-center justify-center rounded-full px-3 text-center type-label transition-[color,transform] duration-300",
              active
                ? "text-label-strong"
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
