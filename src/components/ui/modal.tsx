"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { usePresence } from "@/lib/use-presence";

function DialogShell({
  children,
  open,
  onClose,
}: {
  children: ReactNode;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-end justify-center bg-dimmer/80 p-4 transition-opacity duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] sm:items-center",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      {children}
    </div>
  );
}

function ConfirmSubmitButton({
  label,
  tone,
}: {
  label: string;
  tone: "primary" | "danger";
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      block
      disabled={pending}
      type="submit"
      variant={tone === "danger" ? "danger" : "primary"}
    >
      {pending ? "처리 중..." : label}
    </Button>
  );
}

interface ConfirmActionDialogProps {
  triggerLabel: string;
  title: string;
  description: string;
  confirmLabel: string;
  action: (formData: FormData) => void | Promise<void>;
  fields: Record<string, string>;
  tone?: "primary" | "danger";
  triggerVariant?: "primary" | "secondary" | "ghost" | "danger";
  triggerClassName?: string;
  triggerBlock?: boolean;
  triggerSize?: "sm" | "md" | "lg";
  disabled?: boolean;
}

export function ConfirmActionDialog({
  triggerLabel,
  title,
  description,
  confirmLabel,
  action,
  fields,
  tone = "danger",
  triggerVariant,
  triggerClassName,
  triggerBlock = false,
  triggerSize = "sm",
  disabled = false,
}: ConfirmActionDialogProps) {
  const [open, setOpen] = useState(false);
  const present = usePresence(open, 240);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <>
      <Button
        block={triggerBlock}
        className={triggerClassName}
        disabled={disabled}
        onClick={() => setOpen(true)}
        size={triggerSize}
        type="button"
        variant={triggerVariant ?? (tone === "danger" ? "danger" : "secondary")}
      >
        {triggerLabel}
      </Button>
      {present ? (
        <DialogShell onClose={() => setOpen(false)} open={open}>
          <Card
            aria-describedby={descriptionId}
            aria-labelledby={titleId}
            aria-modal="true"
            className={cn(
              "w-full max-w-md space-y-5 rounded-xl p-5 shadow-lg transition-[opacity,transform] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
              open
                ? "translate-y-0 scale-100 opacity-100"
                : "translate-y-2 scale-[0.98] opacity-0",
            )}
            elevated
            role="dialog"
          >
            <div className="space-y-2">
              <h3 className="type-headline text-label-strong" id={titleId}>
                {title}
              </h3>
              <p className="type-body text-label-alternative" id={descriptionId}>
                {description}
              </p>
            </div>
            <form action={action} className="space-y-4">
              {Object.entries(fields).map(([name, value]) => (
                <input key={name} name={name} type="hidden" value={value} />
              ))}
              <div className="grid grid-cols-2 gap-3">
                <Button block onClick={() => setOpen(false)} type="button" variant="secondary">
                  취소
                </Button>
                <ConfirmSubmitButton label={confirmLabel} tone={tone} />
              </div>
            </form>
          </Card>
        </DialogShell>
      ) : null}
    </>
  );
}
