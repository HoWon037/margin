import type { TextareaHTMLAttributes } from "react";
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
  ...props
}: TextAreaProps) {
  const helperText = error ?? hint;

  return (
    <label className="flex w-full flex-col gap-2">
      <span className="type-label text-label-strong">{label}</span>
      <textarea
        id={id}
        className={cn(
          "min-h-28 rounded-lg border border-line-solid bg-bg-normal px-4 py-3 text-label-normal outline-none transition placeholder:text-label-assistive focus:border-primary focus:ring-4 focus:ring-primary/10",
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
