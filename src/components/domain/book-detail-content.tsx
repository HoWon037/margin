"use client";

import { useState } from "react";
import { BookActionsMenu } from "@/components/domain/book-actions-menu";
import { EditBookDetailsForm } from "@/components/forms/edit-book-details-form";
import { Chip } from "@/components/ui/chip";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/cn";
import { usePresence } from "@/lib/use-presence";
import type { BookSummary } from "@/lib/types";
import { formatBookStatus, formatPages } from "@/lib/utils";

interface BookDetailContentProps {
  book: BookSummary;
  groupId: string;
  redirectTo: string;
  showHeader?: boolean;
  initialEditing?: boolean;
}

const menuTriggerClassName =
  "h-[22px] w-[22px] border-0 bg-transparent p-0 shadow-none md:hover:bg-fill-alternative";

function getBookProgressValue(book: BookSummary) {
  if (book.status === "finished") {
    return 100;
  }

  if (!book.totalPages) {
    return 0;
  }

  return Math.min(100, (book.myLoggedPages / book.totalPages) * 100);
}

export function BookDetailContent({
  book,
  groupId,
  redirectTo,
  showHeader = true,
  initialEditing = false,
}: BookDetailContentProps) {
  const [isEditing, setIsEditing] = useState(initialEditing);
  const showEditForm = usePresence(isEditing, 240);
  const progressValue = getBookProgressValue(book);
  const compact = !showHeader;
  const menu = (
    <BookActionsMenu
      bookId={book.id}
      buttonClassName={menuTriggerClassName}
      groupId={groupId}
      onEdit={() => setIsEditing((current) => !current)}
      redirectTo={redirectTo}
      status={book.status}
    />
  );

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      {showHeader ? (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
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
          <div className="flex items-start justify-self-end gap-3">
            <Chip tone={book.status === "reading" ? "primary" : "neutral"}>
              {formatBookStatus(book.status)}
            </Chip>
            {menu}
          </div>
        </div>
      ) : null}

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

      {showEditForm ? (
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            isEditing ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <div
              className={cn(
                "pt-1 transition-[transform,opacity] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                isEditing ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
              )}
            >
              <EditBookDetailsForm
                author={book.author}
                bookId={book.id}
                groupId={groupId}
                onCancel={() => setIsEditing(false)}
                title={book.title}
                totalPages={book.totalPages}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
