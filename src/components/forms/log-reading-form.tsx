"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveReadingLogAction } from "@/app/actions";
import { initialFormState } from "@/lib/form-state";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import { Toast } from "@/components/ui/toast";
import { formatDateLong, getTodayKey } from "@/lib/date";

interface LogReadingFormProps {
  groupId: string;
  initialBookId?: string;
  books: Array<{
    id: string;
    title: string;
    author: string;
  }>;
}

export function LogReadingForm({
  groupId,
  initialBookId,
  books,
}: LogReadingFormProps) {
  const [state, formAction, pending] = useActionState(
    saveReadingLogAction,
    initialFormState,
  );
  const [bookId, setBookId] = useState(() => {
    if (initialBookId && books.some((book) => book.id === initialBookId)) {
      return initialBookId;
    }

    return books[0]?.id ?? "";
  });
  const [startPage, setStartPage] = useState("");
  const [endPage, setEndPage] = useState("");
  const [pagesRead, setPagesRead] = useState("");
  const [memo, setMemo] = useState("");
  const parsedStartPage = Number(startPage);
  const parsedEndPage = Number(endPage);
  const hasPageRange =
    startPage !== "" &&
    endPage !== "" &&
    Number.isFinite(parsedStartPage) &&
    Number.isFinite(parsedEndPage) &&
    parsedEndPage >= parsedStartPage;
  const derivedPagesRead = hasPageRange
    ? String(parsedEndPage - parsedStartPage + 1)
    : "";
  const effectivePagesRead = derivedPagesRead || pagesRead;
  const todayKey = getTodayKey();

  if (!books.length) {
    return (
      <EmptyState
        actionHref={`/group/${groupId}/books`}
        actionLabel="책 탭으로 가기"
        description="읽는 중인 책이 있어야 기록을 남길 수 있습니다."
        title="기록할 책이 없습니다"
      />
    );
  }

  return (
    <form action={formAction} className="min-w-0">
      <Card className="space-y-5">
        <div className="space-y-1">
          <p className="type-caption uppercase tracking-[0.16em] text-label-assistive">
            {formatDateLong(todayKey)}
          </p>
          <h2 className="text-[1.0625rem] leading-6 font-semibold tracking-[-0.02em] text-label-strong sm:type-heading1">
            오늘 읽은 내용
          </h2>
        </div>

        <input name="groupId" type="hidden" value={groupId} />
        <input name="date" type="hidden" value={todayKey} />

        <Select
          error={state.fieldErrors?.bookId?.[0]}
          label="책"
          name="bookId"
          onChange={(event) => setBookId(event.target.value)}
          value={bookId}
        >
          {books.map((book) => (
            <option key={book.id} value={book.id}>
              {book.title} · {book.author}
            </option>
          ))}
        </Select>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            error={state.fieldErrors?.startPage?.[0]}
            inputMode="numeric"
            label="시작 페이지"
            min={1}
            name="startPage"
            onChange={(event) => setStartPage(event.target.value)}
            pattern="[0-9]*"
            placeholder="40"
            type="number"
            value={startPage}
          />
          <TextField
            error={state.fieldErrors?.endPage?.[0]}
            inputMode="numeric"
            label="끝 페이지"
            min={1}
            name="endPage"
            onChange={(event) => setEndPage(event.target.value)}
            pattern="[0-9]*"
            placeholder="68"
            type="number"
            value={endPage}
          />
        </div>

        <TextField
          error={state.fieldErrors?.pagesRead?.[0]}
          hint={hasPageRange ? "시작 페이지와 끝 페이지로 자동 계산됩니다." : undefined}
          inputMode="numeric"
          label="읽은 페이지"
          min={1}
          name="pagesRead"
          onChange={(event) => setPagesRead(event.target.value)}
          pattern="[0-9]*"
          placeholder="24"
          readOnly={hasPageRange}
          type="number"
          value={effectivePagesRead}
        />

        <TextArea
          error={state.fieldErrors?.memo?.[0]}
          label="메모"
          maxLength={220}
          name="memo"
          onChange={(event) => setMemo(event.target.value)}
          placeholder="짧게 남겨도 됩니다."
          value={memo}
        />

        {state.message ? (
          <Toast
            title={state.message}
            tone={state.status === "success" ? "positive" : "negative"}
          />
        ) : null}

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
          <Button block disabled={pending} size="md" type="submit">
            {pending ? "저장하는 중..." : "기록 저장하기"}
          </Button>
          <Link
            className={buttonStyles({
              block: true,
              variant: "secondary",
              size: "md",
            })}
            href={`/group/${groupId}`}
          >
            취소
          </Link>
        </div>
      </Card>
    </form>
  );
}
