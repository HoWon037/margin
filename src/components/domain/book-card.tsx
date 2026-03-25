import type { ReactNode } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { BookSummary } from "@/lib/types";

interface BookCardProps {
  book: BookSummary;
  groupId: string;
  href?: string;
  selected?: boolean;
  expandedContent?: ReactNode;
  headerActions?: ReactNode;
}

export function BookCard({
  book,
  groupId,
  href,
  selected = false,
  expandedContent,
  headerActions,
}: BookCardProps) {
  return (
    <Card
      interactive
      className={`overflow-hidden p-0 ${selected ? "border-primary/35 shadow-sm" : ""}`}
    >
      <div className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <Link
          className="min-w-0 flex-1"
          href={href ?? `/group/${groupId}/books?book=${book.id}`}
          scroll={false}
        >
          <div className="space-y-1">
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
        </Link>
        {headerActions ? <div className="shrink-0">{headerActions}</div> : null}
      </div>

      {selected && expandedContent ? (
        <div className="expand-reveal px-4 pt-0 pb-4 sm:hidden">
          {expandedContent}
        </div>
      ) : null}
    </Card>
  );
}
