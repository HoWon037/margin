import { notFound } from "next/navigation";
import { LogReadingForm } from "@/components/forms/log-reading-form";
import { Toast } from "@/components/ui/toast";
import { getGroupWorkspace } from "@/lib/data/queries";
import { getStringParam, readToast } from "@/lib/toast";

interface LogPageProps {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LogPage({ params, searchParams }: LogPageProps) {
  const { groupId } = await params;
  const resolvedSearchParams = await searchParams;
  const workspace = await getGroupWorkspace(groupId);
  const selectedBookId = getStringParam(resolvedSearchParams, "book");
  const toast = readToast(resolvedSearchParams);

  if (!workspace) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-[1040px] space-y-5">
      {toast ? (
        <Toast
          description={toast.description}
          title={toast.title}
          tone={toast.tone}
        />
      ) : null}
      <LogReadingForm
        books={workspace.books
          .filter(
            (book) => book.status === "reading" && book.createdBy === workspace.me.id,
          )
          .map((book) => ({
            id: book.id,
            title: book.title,
            author: book.author,
          }))}
        groupId={groupId}
        initialBookId={selectedBookId ?? undefined}
      />
    </div>
  );
}
