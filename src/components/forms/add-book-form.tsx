"use client";

import { useActionState, useEffect, useRef } from "react";
import { MAX_ACTIVE_READING_BOOKS } from "@/lib/constants";
import { createBookAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TextField } from "@/components/ui/text-field";
import { Toast } from "@/components/ui/toast";
import { initialFormState } from "@/lib/form-state";

export function AddBookForm({ groupId }: { groupId: string }) {
  const [state, formAction, pending] = useActionState(
    createBookAction,
    initialFormState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <Card className="space-y-4">
      <div className="space-y-1">
        <p className="type-headline text-label-strong">책 추가</p>
        <p className="type-caption text-label-assistive">
          읽는 중은 {MAX_ACTIVE_READING_BOOKS}권까지 둘 수 있습니다.
        </p>
      </div>

      <form ref={formRef} action={formAction} className="space-y-4">
        <input name="groupId" type="hidden" value={groupId} />

        <div className="grid gap-4 md:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)_128px]">
          <div className="min-w-0">
            <TextField
              className="w-full"
              error={state.fieldErrors?.title?.[0]}
              label="책 제목"
              name="title"
              placeholder="에덴의 동쪽"
              required
            />
          </div>
          <div className="min-w-0">
            <TextField
              className="w-full"
              error={state.fieldErrors?.author?.[0]}
              label="저자"
              name="author"
              placeholder="존 스타인벡"
              required
            />
          </div>
          <div className="min-w-0">
            <TextField
              className="w-full"
              error={state.fieldErrors?.totalPages?.[0]}
              inputMode="numeric"
              label="전체 페이지"
              min={1}
              name="totalPages"
              pattern="[0-9]*"
              placeholder="320"
              required
              type="number"
            />
          </div>
        </div>

        {state.message ? (
          <Toast
            title={state.message}
            tone={state.status === "success" ? "positive" : "negative"}
          />
        ) : null}

        <Button block disabled={pending} type="submit">
          {pending ? "추가하는 중..." : "책 추가하기"}
        </Button>
      </form>
    </Card>
  );
}
