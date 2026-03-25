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
  name,
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const stableNameId =
    typeof name === "string" && name.trim().length
      ? `field-${name.trim().replace(/[^a-zA-Z0-9_-]/g, "-")}`
      : undefined;
  const inputId = id ?? stableNameId ?? generatedId;
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
          "field-surface h-12 rounded-lg border border-line-solid px-4 text-label-normal outline-none transition placeholder:text-label-assistive focus:border-primary focus:ring-4 focus:ring-primary/15",
          error && "border-negative focus:border-negative focus:ring-negative/10",
          className,
        )}
        name={name}
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
