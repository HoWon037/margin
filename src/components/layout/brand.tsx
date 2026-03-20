import Link from "next/link";

export function Brand({
  compact = false,
  href = "/",
}: {
  compact?: boolean;
  href?: string;
}) {
  return (
    <Link className="inline-flex items-center gap-2" href={href}>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-label-strong text-sm font-semibold text-white">
        M
      </span>
      <div className={compact ? "hidden sm:block" : ""}>
        <p className="type-label uppercase tracking-[0.18em] text-label-assistive">
          Margin
        </p>
        {!compact ? (
          <p className="type-caption text-label-alternative">
            사적인 독서 기록
          </p>
        ) : null}
      </div>
    </Link>
  );
}
