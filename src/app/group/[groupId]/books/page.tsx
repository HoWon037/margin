import { notFound } from "next/navigation";
import { updateBookStatusAction } from "@/app/actions";
import { BookCard } from "@/components/domain/book-card";
import { AddBookForm } from "@/components/forms/add-book-form";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Tabs } from "@/components/ui/tabs";
import { Toast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { BOOK_STATUS_OPTIONS } from "@/lib/constants";
import { getGroupWorkspace } from "@/lib/data/queries";
import { getStringParam, readToast } from "@/lib/toast";
import type { BookSummary } from "@/lib/types";
import { formatBookStatus, formatPages } from "@/lib/utils";

interface BooksPageProps {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

interface BookDetailPanelProps {
  book: BookSummary;
  groupId: string;
  statusFilter: "reading" | "finished";
}

function getBookProgressValue(book: BookSummary) {
  if (book.status === "finished") {
    return 100;
  }

  if (!book.totalPages) {
    return 0;
  }

  return Math.min(100, (book.myLoggedPages / book.totalPages) * 100);
}

function BookStatsGrid({ book }: { book: BookSummary }) {
  const progressValue = getBookProgressValue(book);

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-fill-alternative p-4">
          <p className="type-caption text-label-assistive">전체 페이지</p>
          <p className="mt-1 type-label text-label-strong">
            {formatPages(book.totalPages)}
          </p>
        </div>
        <div className="rounded-2xl bg-fill-alternative p-4">
          <p className="type-caption text-label-assistive">내 기록</p>
          <p className="mt-1 type-label text-label-strong">
            {formatPages(book.myLoggedPages)}
          </p>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl bg-fill-alternative p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="type-label text-label-strong">진행률</p>
          <p className="type-caption text-label-alternative">
            {Math.round(progressValue)}%
          </p>
        </div>
        <ProgressBar tone="primary" value={progressValue} />
      </div>
    </>
  );
}

function BookStatusActions({
  book,
  groupId,
  statusFilter,
}: BookDetailPanelProps) {
  return (
    <div className="space-y-3">
      <p className="type-label text-label-strong">상태</p>
      <div className="grid grid-cols-2 gap-3">
        {BOOK_STATUS_OPTIONS.map((option) => {
          const active = book.status === option.value;

          return (
            <form key={option.value} action={updateBookStatusAction}>
              <input name="groupId" type="hidden" value={groupId} />
              <input name="bookId" type="hidden" value={book.id} />
              <input
                name="redirectTo"
                type="hidden"
                value={buildBooksHref(groupId, statusFilter, book.id)}
              />
              <input name="status" type="hidden" value={option.value} />
              <button
                className={cn(
                  "flex h-12 w-full items-center justify-center rounded-2xl border type-label transition",
                  active
                    ? "border-primary/25 bg-primary/10 text-label-strong"
                    : "border-line-solid bg-bg-normal text-label-alternative md:hover:border-line-normal md:hover:bg-fill-alternative md:hover:text-label-strong",
                )}
                disabled={active}
                type="submit"
              >
                {option.label}
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}

function MobileBookExpanded({
  book,
  groupId,
  statusFilter,
}: BookDetailPanelProps) {
  return (
    <div className="space-y-3 sm:hidden">
      <BookStatsGrid book={book} />
      <BookStatusActions
        book={book}
        groupId={groupId}
        statusFilter={statusFilter}
      />
    </div>
  );
}

function buildBooksHref(groupId: string, status: string, bookId?: string) {
  const params = new URLSearchParams();
  params.set("status", status);

  if (bookId) {
    params.set("book", bookId);
  }

  return `/group/${groupId}/books?${params.toString()}`;
}

function BookDetailPanel({
  book,
  groupId,
  statusFilter,
}: BookDetailPanelProps) {
  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="truncate type-headline text-label-strong" title={book.title}>
            {book.title}
          </p>
          <p
            className="truncate type-label-reading text-label-alternative"
            title={book.author}
          >
            {book.author}
          </p>
        </div>
        <Chip tone={book.status === "reading" ? "primary" : "neutral"}>
          {formatBookStatus(book.status)}
        </Chip>
      </div>

      <BookStatsGrid book={book} />
      <BookStatusActions
        book={book}
        groupId={groupId}
        statusFilter={statusFilter}
      />
    </Card>
  );
}

export default async function BooksPage({
  params,
  searchParams,
}: BooksPageProps) {
  const { groupId } = await params;
  const resolvedSearchParams = await searchParams;
  const workspace = await getGroupWorkspace(groupId);
  const toast = readToast(resolvedSearchParams);
  const selectedBookId = getStringParam(resolvedSearchParams, "book");
  const rawStatusFilter = getStringParam(resolvedSearchParams, "status");
  const statusFilter = rawStatusFilter === "finished" ? "finished" : "reading";

  if (!workspace) {
    notFound();
  }

  const myBooks = workspace.books.filter((book) => book.createdBy === workspace.me.id);
  const readingBooks = myBooks.filter((book) => book.status === "reading");
  const finishedBooks = myBooks.filter((book) => book.status === "finished");
  const filteredBooks = statusFilter === "reading" ? readingBooks : finishedBooks;
  const selectedBook =
    filteredBooks.find((book) => book.id === selectedBookId) ?? filteredBooks[0] ?? null;

  return (
    <div className="space-y-6">
      {toast ? (
        <Toast
          description={toast.description}
          title={toast.title}
          tone={toast.tone}
        />
      ) : null}

      <AddBookForm groupId={groupId} />

      <Tabs
        items={[
          {
            label: `읽는 중 ${readingBooks.length}`,
            href: buildBooksHref(groupId, "reading"),
            active: statusFilter === "reading",
          },
          {
            label: `완독 ${finishedBooks.length}`,
            href: buildBooksHref(groupId, "finished"),
            active: statusFilter === "finished",
          },
        ]}
      />

      <div className="grid gap-6 min-[720px]:grid-cols-[280px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          {filteredBooks.length ? (
            filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                expandedContent={
                  book.id === selectedBook?.id ? (
                    <MobileBookExpanded
                      book={selectedBook}
                      groupId={groupId}
                      statusFilter={statusFilter}
                    />
                  ) : undefined
                }
                groupId={groupId}
                href={buildBooksHref(groupId, statusFilter, book.id)}
                selected={book.id === selectedBook?.id}
              />
            ))
          ) : myBooks.length ? (
            <EmptyState
              actionHref={buildBooksHref(
                groupId,
                statusFilter === "reading" ? "finished" : "reading",
              )}
              actionLabel={statusFilter === "reading" ? "완독 보기" : "읽는 중 보기"}
              description={
                statusFilter === "reading"
                  ? "지금 읽는 중인 책이 없습니다."
                  : "아직 완독한 책이 없습니다."
              }
              title={statusFilter === "reading" ? "읽는 중인 책이 없습니다" : "완독한 책이 없습니다"}
            />
          ) : (
            <EmptyState
              description="내가 읽을 책을 먼저 추가해 주세요."
              title="아직 추가한 책이 없습니다"
            />
          )}
        </div>

        {selectedBook ? (
          <div className="hidden min-[720px]:block min-[720px]:sticky min-[720px]:top-24">
            <BookDetailPanel
              book={selectedBook}
              groupId={groupId}
              statusFilter={statusFilter}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
