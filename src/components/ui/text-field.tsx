import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface TextFieldProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function TextField({
  id,
  label,
  hint,
  error,
  className,
  ...props
}: TextFieldProps) {
  const helperText = error ?? hint;

  return (
    <label className="flex w-full flex-col gap-2">
      <span className="type-label text-label-strong">{label}</span>
      <input
        id={id}
        className={cn(
          "h-12 rounded-lg border border-line-solid bg-bg-normal px-4 text-label-normal outline-none transition placeholder:text-label-assistive focus:border-primary focus:ring-4 focus:ring-primary/10",
          error && "border-negative focus:border-negative focus:ring-negative/10",
          className,
        )}
        {...props}
      />
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
