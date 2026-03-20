import { redirect } from "next/navigation";
import { EntryAuthForm } from "@/components/forms/entry-auth-form";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";
import { getCurrentUserSummary, getLandingWorkspace } from "@/lib/data/queries";
import { readToast } from "@/lib/toast";
import Link from "next/link";

interface EntryPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function EntryPage({ searchParams }: EntryPageProps) {
  const resolvedSearchParams = await searchParams;
  const toast = readToast(resolvedSearchParams);
  const user = await getCurrentUserSummary();

  if (user) {
    redirect("/groups");
  }

  const workspace = await getLandingWorkspace();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(91,108,255,0.14),transparent_56%)]" />
      <div className="w-full max-w-[460px]">
        <Card elevated className="surface-soft relative overflow-hidden rounded-[28px] border-white/80 p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(91,108,255,0.09),transparent)]" />
          <div className="relative space-y-6">
            <div className="flex items-center gap-4">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-[18px] bg-label-strong text-lg font-semibold text-white shadow-xs">
                M
              </span>
              <span className="type-title2 text-label-strong">Margin</span>
            </div>

            {toast ? (
              <Toast
                description={toast.description}
                title={toast.title}
                tone={toast.tone}
              />
            ) : null}

            <EntryAuthForm />

            <div className="flex items-center justify-between gap-3 rounded-[18px] border border-line-solid bg-bg-normal/85 px-4 py-4">
              <p className="type-label text-label-strong">데모 모임</p>
              <Link
                className={buttonStyles({ size: "sm", variant: "secondary" })}
                href={`/group/${workspace.group.id}`}
              >
                열기
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
