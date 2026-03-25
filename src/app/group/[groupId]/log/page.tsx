import { notFound } from "next/navigation";
import { LogReadingForm } from "@/components/forms/log-reading-form";
import { Card } from "@/components/ui/card";
import { getGroupWorkspace } from "@/lib/data/queries";
import { formatDateLong, getTodayKey } from "@/lib/date";
import { getStringParam } from "@/lib/toast";

interface LogPageProps {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LogPage({ params, searchParams }: LogPageProps) {
  const { groupId } = await params;
  const resolvedSearchParams = await searchParams;
  const workspace = await getGroupWorkspace(groupId);
  const selectedBookId = getStringParam(resolvedSearchParams, "book");
  const editLogId = getStringParam(resolvedSearchParams, "edit");
  const todayKey = getTodayKey();

  if (!workspace) {
    notFound();
  }

  if (todayKey < workspace.group.recordStartDate) {
    return (
      <div className="mx-auto w-full max-w-[1040px] space-y-5">
        <Card className="space-y-2">
          <p className="type-headline text-label-strong">아직 기록을 시작할 수 없습니다</p>
          <p className="type-body text-label-alternative">
            이 모임의 기록 시작일은 {formatDateLong(workspace.group.recordStartDate)}입니다.
          </p>
        </Card>
      </div>
    );
  }

  const editableLog =
    workspace.recentLogs.find(
      (log) => log.id === editLogId && log.member.id === workspace.me.id,
    ) ?? null;
  const visibleBooks = workspace.books.filter(
    (book) =>
      (book.status === "reading" && book.createdBy === workspace.me.id) ||
      (editableLog?.book?.id ? book.id === editableLog.book.id : false),
  );

  return (
    <div className="mx-auto w-full max-w-[1040px] space-y-5">
      <LogReadingForm
        bookDefaults={Object.fromEntries(
          workspace.recentLogs
            .filter((log) => log.member.id === workspace.me.id && log.book)
            .reduce<Array<[string, number]>>((acc, log) => {
              const bookId = log.book?.id;

              if (!bookId || acc.some(([existingBookId]) => existingBookId === bookId)) {
                return acc;
              }

              const nextStartPage =
                typeof log.endPage === "number"
                  ? log.endPage + 1
                  : typeof log.startPage === "number"
                    ? log.startPage + log.pagesRead
                    : null;

              if (!nextStartPage || nextStartPage < 1) {
                return acc;
              }

              acc.push([bookId, nextStartPage]);
              return acc;
            }, []),
        )}
        books={visibleBooks.map((book) => ({
            id: book.id,
            title: book.title,
            author: book.author,
            totalPages: book.totalPages,
          }))}
        groupId={groupId}
        initialLog={
          editableLog
            ? {
                id: editableLog.id,
                date: editableLog.date,
                bookId: editableLog.book?.id ?? "",
                pagesRead: editableLog.pagesRead,
                memo: editableLog.memo,
                startPage: editableLog.startPage,
                endPage: editableLog.endPage,
              }
            : undefined
        }
        initialBookId={selectedBookId ?? undefined}
      />
    </div>
  );
}
