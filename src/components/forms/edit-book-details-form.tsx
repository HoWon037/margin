"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { updateBookDetailsAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { initialFormState } from "@/lib/form-state";

interface EditBookDetailsFormProps {
  groupId: string;
  bookId: string;
  title: string;
  author: string;
  totalPages: number;
  onCancel?: () => void;
}

export function EditBookDetailsForm({
  groupId,
  bookId,
  title,
  author,
  totalPages,
  onCancel,
}: EditBookDetailsFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, formAction, pending] = useActionState(
    updateBookDetailsAction,
    initialFormState,
  );

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("edit");
    const nextHref = params.toString() ? `${pathname}?${params.toString()}` : pathname;

    onCancel?.();
    router.replace(nextHref, { scroll: false });
  }, [onCancel, pathname, router, searchParams, state.status]);

  return (
    <form action={formAction} className="space-y-4">
      <input name="groupId" type="hidden" value={groupId} />
      <input name="bookId" type="hidden" value={bookId} />

      <div className="space-y-3 rounded-2xl bg-fill-alternative p-4">
        <p className="type-label text-label-strong">책 정보 수정</p>
        <div className="space-y-3">
          <TextField
            defaultValue={title}
            error={state.fieldErrors?.title?.[0]}
            label="책 제목"
            name="title"
            required
          />
          <TextField
            defaultValue={author}
            error={state.fieldErrors?.author?.[0]}
            label="저자"
            name="author"
            required
          />
          <TextField
            defaultValue={String(totalPages)}
            error={state.fieldErrors?.totalPages?.[0]}
            inputMode="numeric"
            label="전체 페이지"
            min={1}
            name="totalPages"
            pattern="[0-9]*"
            required
            type="number"
          />
        </div>
        {state.status === "error" && state.message ? (
          <p className="type-label text-negative">{state.message}</p>
        ) : null}
        <div>
          <Button
            block
            disabled={pending}
            size="md"
            type="submit"
            variant="secondary"
          >
            {pending ? "저장하는 중..." : "정보 저장"}
          </Button>
        </div>
      </div>
    </form>
  );
}
