import { notFound } from "next/navigation";
import { BookActionsMenu } from "@/components/domain/book-actions-menu";
import { BookCard } from "@/components/domain/book-card";
import { BookDetailContent } from "@/components/domain/book-detail-content";
import { AddBookForm } from "@/components/forms/add-book-form";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";
import { getGroupWorkspace } from "@/lib/data/queries";
import { getStringParam } from "@/lib/toast";
import type { BookSummary } from "@/lib/types";

interface BooksPageProps {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

interface BookDetailPanelProps {
  book: BookSummary;
  groupId: string;
  statusFilter: "reading" | "finished";
  initialEditing?: boolean;
}

function MobileBookExpanded({
  book,
  groupId,
  statusFilter,
  initialEditing = false,
}: BookDetailPanelProps) {
  return (
    <div className="sm:hidden">
      <BookDetailContent
        book={book}
        groupId={groupId}
        initialEditing={initialEditing}
        key={`${book.id}:${initialEditing ? "edit" : "view"}:mobile`}
        redirectTo={buildBooksHref(groupId, statusFilter, book.id)}
        showHeader={false}
      />
    </div>
  );
}

function buildBooksHref(
  groupId: string,
  status: string,
  bookId?: string,
  edit?: boolean,
) {
  const params = new URLSearchParams();
  params.set("status", status);

  if (bookId) {
    params.set("book", bookId);
  }

  if (edit) {
    params.set("edit", "details");
  }

  return `/group/${groupId}/books?${params.toString()}`;
}

function BookDetailPanel({
  book,
  groupId,
  statusFilter,
  initialEditing = false,
}: BookDetailPanelProps) {
  return (
    <Card className="space-y-4">
      <BookDetailContent
        book={book}
        groupId={groupId}
        initialEditing={initialEditing}
        key={`${book.id}:${initialEditing ? "edit" : "view"}:desktop`}
        redirectTo={buildBooksHref(groupId, statusFilter, book.id)}
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
  const selectedBookId = getStringParam(resolvedSearchParams, "book");
  const rawStatusFilter = getStringParam(resolvedSearchParams, "status");
  const editMode = getStringParam(resolvedSearchParams, "edit") === "details";
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
                      initialEditing={editMode}
                      statusFilter={statusFilter}
                    />
                  ) : undefined
                }
                groupId={groupId}
                headerActions={
                  <BookActionsMenu
                    bookId={book.id}
                    buttonClassName="h-[22px] w-[22px] border-0 bg-transparent p-0 shadow-none md:hover:bg-fill-alternative"
                    editHref={buildBooksHref(groupId, statusFilter, book.id, true)}
                    groupId={groupId}
                    redirectTo={buildBooksHref(groupId, statusFilter, book.id)}
                    status={book.status}
                  />
                }
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
              initialEditing={editMode}
              statusFilter={statusFilter}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
