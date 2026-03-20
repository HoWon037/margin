import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const sizeStyles = {
  sm: "h-9 rounded-md px-3.5 type-label",
  md: "h-11 rounded-lg px-4 type-label",
  lg: "h-13 rounded-lg px-5 type-label",
};

const variantStyles = {
  primary:
    "bg-primary text-white shadow-xs transition md:hover:bg-primary-strong md:hover:-translate-y-px",
  secondary:
    "border border-line-solid bg-bg-normal text-label-strong transition md:hover:bg-fill-alternative md:hover:-translate-y-px",
  ghost:
    "bg-transparent text-label-alternative transition md:hover:bg-fill-normal md:hover:text-label-strong",
  danger:
    "border border-negative/15 bg-negative/10 text-negative transition md:hover:bg-negative/15 md:hover:-translate-y-px",
};

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  block?: boolean;
}

export function buttonStyles({
  className,
  variant = "primary",
  size = "md",
  block = false,
}: Pick<ButtonProps, "className" | "variant" | "size" | "block">) {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap border font-medium outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:pointer-events-none disabled:opacity-50",
    sizeStyles[size],
    variantStyles[variant],
    block && "w-full",
    className,
  );
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  block = false,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonStyles({ className, variant, size, block })}
      type={type}
      {...props}
    />
  );
}
