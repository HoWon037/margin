import { useId, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function Select({
  id,
  label,
  hint,
  error,
  className,
  children,
  name,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const stableNameId =
    typeof name === "string" && name.trim().length
      ? `field-${name.trim().replace(/[^a-zA-Z0-9_-]/g, "-")}`
      : undefined;
  const selectId = id ?? stableNameId ?? generatedId;
  const helperText = error ?? hint;
  const helperId = helperText ? `${selectId}-helper` : undefined;

  return (
    <label className="flex w-full flex-col gap-2" htmlFor={selectId}>
      <span className="type-label text-label-strong">{label}</span>
      <select
        id={selectId}
        aria-describedby={helperId}
        aria-invalid={error ? true : undefined}
        className={cn(
          "field-surface h-12 rounded-lg border border-line-solid px-4 text-label-normal outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15",
          error && "border-negative focus:border-negative focus:ring-negative/10",
          className,
        )}
        name={name}
        {...props}
      >
        {children}
      </select>
      {helperText ? (
        <span
          id={helperId}
          className={cn(
            "type-caption",
            error ? "text-negative" : "text-label-assistive",
          )}
        >
          {helperText}
        </span>
      ) : null}
    </label>
  );
}
