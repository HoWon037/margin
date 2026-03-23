import { useId, type InputHTMLAttributes } from "react";
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
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperText = error ?? hint;
  const helperId = helperText ? `${inputId}-helper` : undefined;

  return (
    <label className="flex w-full flex-col gap-2" htmlFor={inputId}>
      <span className="type-label text-label-strong">{label}</span>
      <input
        id={inputId}
        aria-describedby={helperId}
        aria-invalid={error ? true : undefined}
        className={cn(
          "field-surface h-12 rounded-lg border border-line-solid bg-bg-normal px-4 text-label-normal outline-none transition placeholder:text-label-assistive focus:border-primary focus:ring-4 focus:ring-primary/10",
          error && "border-negative focus:border-negative focus:ring-negative/10",
          className,
        )}
        {...props}
      />
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
