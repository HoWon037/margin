"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
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
  initialLog?: {
    id: string;
    date: string;
    bookId: string;
    pagesRead: number;
    memo: string;
    startPage: number | null;
    endPage: number | null;
  };
  bookDefaults: Record<string, number>;
  books: Array<{
    id: string;
    title: string;
    author: string;
    totalPages: number;
  }>;
}

export function LogReadingForm({
  groupId,
  initialBookId,
  initialLog,
  bookDefaults,
  books,
}: LogReadingFormProps) {
  const defaultBookId =
    initialLog?.bookId && books.some((book) => book.id === initialLog.bookId)
      ? initialLog.bookId
      : initialBookId && books.some((book) => book.id === initialBookId)
        ? initialBookId
      : (books[0]?.id ?? "");
  const [state, formAction, pending] = useActionState(
    saveReadingLogAction,
    initialFormState,
  );
  const [bookId, setBookId] = useState(defaultBookId);
  const [startPage, setStartPage] = useState(() =>
    typeof initialLog?.startPage === "number"
      ? String(initialLog.startPage)
      : bookDefaults[defaultBookId]
      ? String(bookDefaults[defaultBookId])
      : "",
  );
  const [endPage, setEndPage] = useState(
    typeof initialLog?.endPage === "number" ? String(initialLog.endPage) : "",
  );
  const [pagesRead, setPagesRead] = useState(
    initialLog ? String(initialLog.pagesRead) : "",
  );
  const [memo, setMemo] = useState(initialLog?.memo ?? "");
  const [clientError, setClientError] = useState<string | null>(null);
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
  const todayKey = initialLog?.date ?? getTodayKey();
  const selectedBook = useMemo(
    () => books.find((book) => book.id === bookId) ?? null,
    [bookId, books],
  );

  function handleBookChange(nextBookId: string) {
    setBookId(nextBookId);
    setStartPage(bookDefaults[nextBookId] ? String(bookDefaults[nextBookId]) : "");
    setEndPage("");
    setPagesRead("");
    setClientError(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!selectedBook) {
      return;
    }

    const totalPages = selectedBook.totalPages;

    if (hasPageRange) {
      if (parsedStartPage > totalPages || parsedEndPage > totalPages) {
        event.preventDefault();
        setClientError(`전체 ${totalPages}페이지를 넘길 수 없습니다.`);
      }
      return;
    }

    const numericPagesRead = Number(effectivePagesRead);
    if (!Number.isFinite(numericPagesRead) || numericPagesRead < 1) {
      return;
    }

    if (startPage !== "" && Number.isFinite(parsedStartPage)) {
      const derivedEndPage = parsedStartPage + numericPagesRead - 1;
      if (parsedStartPage > totalPages || derivedEndPage > totalPages) {
        event.preventDefault();
        setClientError(`전체 ${totalPages}페이지를 넘길 수 없습니다.`);
        return;
      }
    }

    if (numericPagesRead > totalPages) {
      event.preventDefault();
      setClientError(`전체 ${totalPages}페이지를 넘길 수 없습니다.`);
    }
  }

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
    <form action={formAction} className="min-w-0" onSubmit={handleSubmit}>
      <Card className="space-y-5">
        <div className="space-y-1">
          <p className="type-caption uppercase tracking-[0.16em] text-label-assistive">
            {formatDateLong(todayKey)}
          </p>
          <h2 className="text-[1.0625rem] leading-6 font-semibold tracking-[-0.02em] text-label-strong sm:type-heading1">
            {initialLog ? "기록 수정" : "오늘 읽은 내용"}
          </h2>
        </div>

        <input name="groupId" type="hidden" value={groupId} />
        <input name="date" type="hidden" value={todayKey} />
        {initialLog ? <input name="logId" type="hidden" value={initialLog.id} /> : null}

        <Select
          error={state.fieldErrors?.bookId?.[0]}
          label="책"
          name="bookId"
          onChange={(event) => handleBookChange(event.target.value)}
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
            onChange={(event) => {
              setStartPage(event.target.value);
              setClientError(null);
            }}
            pattern="[0-9]*"
            type="number"
            value={startPage}
          />
          <TextField
            error={state.fieldErrors?.endPage?.[0]}
            inputMode="numeric"
            label="끝 페이지"
            min={1}
            name="endPage"
            onChange={(event) => {
              setEndPage(event.target.value);
              setClientError(null);
            }}
            pattern="[0-9]*"
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
          onChange={(event) => {
            setPagesRead(event.target.value);
            setClientError(null);
          }}
          pattern="[0-9]*"
          readOnly={hasPageRange}
          type="number"
          value={effectivePagesRead}
        />

        <TextArea
          error={state.fieldErrors?.memo?.[0]}
          label="메모"
          maxLength={220}
          name="memo"
          onChange={(event) => {
            setMemo(event.target.value);
            setClientError(null);
          }}
          value={memo}
        />

        {clientError ? (
          <Toast title={clientError} tone="negative" />
        ) : null}

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
