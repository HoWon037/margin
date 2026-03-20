"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ConfirmDialogProps {
  triggerLabel: string;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "primary" | "danger";
}

export function ConfirmDialog({
  triggerLabel,
  title,
  description,
  confirmLabel,
  tone = "danger",
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        variant={tone === "danger" ? "danger" : "secondary"}
        type="button"
      >
        {triggerLabel}
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-dimmer/80 p-4 sm:items-center">
          <Card
            className="w-full max-w-md space-y-5 rounded-xl p-5 shadow-lg"
            elevated
          >
            <div className="space-y-2">
              <h3 className="type-headline text-label-strong">{title}</h3>
              <p className="type-body text-label-alternative">{description}</p>
            </div>
            <div className="flex gap-3">
              <Button
                block
                onClick={() => setOpen(false)}
                type="button"
                variant="secondary"
              >
                취소
              </Button>
              <Button
                block
                onClick={() => setOpen(false)}
                type="button"
                variant={tone === "danger" ? "danger" : "primary"}
              >
                {confirmLabel}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </>
  );
}
