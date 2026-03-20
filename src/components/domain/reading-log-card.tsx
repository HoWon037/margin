import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { formatDateShort } from "@/lib/date";
import type { EnrichedReadingLog } from "@/lib/types";
import { formatPages } from "@/lib/utils";

interface ReadingLogCardProps {
  log: EnrichedReadingLog;
}

export function ReadingLogCard({ log }: ReadingLogCardProps) {
  const pageRange =
    typeof log.startPage === "number" && typeof log.endPage === "number"
      ? `${log.startPage}-${log.endPage} 페이지`
      : null;
  const bookTitle = log.book?.title ?? "제목 없음";
  const bookAuthor = log.book?.author ?? "";

  return (
    <Card interactive className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Avatar name={log.member.nickname} tone={log.member.avatarColor} />
          <div className="space-y-1">
            <p className="type-label text-label-strong">{log.member.nickname}</p>
            <p className="type-caption text-label-assistive">
              {formatDateShort(log.date)} · {log.weekdayLabel}
            </p>
          </div>
        </div>
        <div className="min-w-0 space-y-1 text-right">
          <p className="type-headline text-label-strong">{bookTitle}</p>
          {bookAuthor ? (
            <p className="type-label-reading text-label-alternative">{bookAuthor}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1">
        <p className="type-headline text-label-strong">
          {pageRange ?? `${formatPages(log.pagesRead)}`}
        </p>
        <p className="type-label-reading text-label-alternative">
          {formatPages(log.pagesRead)} 읽음
        </p>
      </div>

      {log.memo ? (
        <p className="type-body-reading text-label-normal">{log.memo}</p>
      ) : (
        <p className="type-body text-label-assistive">메모 없음</p>
      )}
    </Card>
  );
}
