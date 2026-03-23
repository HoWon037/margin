import type { SelectHTMLAttributes } from "react";
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
  ...props
}: SelectProps) {
  const helperText = error ?? hint;

  return (
    <label className="flex w-full flex-col gap-2">
      <span className="type-label text-label-strong">{label}</span>
      <select
        id={id}
        className={cn(
          "field-surface h-12 rounded-lg border border-line-solid bg-bg-normal px-4 text-label-normal outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10",
          error && "border-negative focus:border-negative focus:ring-negative/10",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {helperText ? (
        <span
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
