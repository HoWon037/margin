"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function DialogShell({
  children,
  onClose,
}: {
  children: ReactNode;
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-dimmer/80 p-4 sm:items-center"
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
  disabled = false,
}: ConfirmActionDialogProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <>
      <Button
        disabled={disabled}
        onClick={() => setOpen(true)}
        size="sm"
        type="button"
        variant={triggerVariant ?? (tone === "danger" ? "danger" : "secondary")}
      >
        {triggerLabel}
      </Button>
      {open ? (
        <DialogShell onClose={() => setOpen(false)}>
          <Card
            aria-describedby={descriptionId}
            aria-labelledby={titleId}
            aria-modal="true"
            className="w-full max-w-md space-y-5 rounded-xl p-5 shadow-lg"
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
