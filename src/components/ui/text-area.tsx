import { useId, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface TextAreaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function TextArea({
  id,
  label,
  hint,
  error,
  className,
  name,
  ...props
}: TextAreaProps) {
  const generatedId = useId();
  const stableNameId =
    typeof name === "string" && name.trim().length
      ? `field-${name.trim().replace(/[^a-zA-Z0-9_-]/g, "-")}`
      : undefined;
  const textAreaId = id ?? stableNameId ?? generatedId;
  const helperText = error ?? hint;
  const helperId = helperText ? `${textAreaId}-helper` : undefined;

  return (
    <label className="flex w-full flex-col gap-2" htmlFor={textAreaId}>
      <span className="type-label text-label-strong">{label}</span>
      <textarea
        id={textAreaId}
        aria-describedby={helperId}
        aria-invalid={error ? true : undefined}
        className={cn(
          "field-surface min-h-28 rounded-lg border border-line-solid px-4 py-3 text-label-normal outline-none transition placeholder:text-label-assistive focus:border-primary focus:ring-4 focus:ring-primary/15",
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
