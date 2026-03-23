import type { ReactNode } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import type { BookSummary } from "@/lib/types";
import { formatBookStatus } from "@/lib/utils";

interface BookCardProps {
  book: BookSummary;
  groupId: string;
  href?: string;
  selected?: boolean;
  expandedContent?: ReactNode;
}

export function BookCard({
  book,
  groupId,
  href,
  selected = false,
  expandedContent,
}: BookCardProps) {
  return (
    <Card
      interactive
      className={`overflow-hidden p-0 ${selected ? "border-primary/35 shadow-sm" : ""}`}
    >
      <Link
        className="block p-4 sm:p-5"
        href={href ?? `/group/${groupId}/books?book=${book.id}`}
        scroll={false}
      >
        <div className="space-y-3">
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
        </div>
      </Link>

      {selected && expandedContent ? (
        <div className="expand-reveal px-4 py-4 sm:hidden">
          {expandedContent}
        </div>
      ) : null}
    </Card>
  );
}
