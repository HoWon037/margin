import { notFound } from "next/navigation";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";
import { getGroupWorkspace } from "@/lib/data/queries";
import { readToast } from "@/lib/toast";
import { formatPages } from "@/lib/utils";

interface WeeklyPageProps {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function WeeklyPage({
  params,
  searchParams,
}: WeeklyPageProps) {
  const { groupId } = await params;
  const resolvedSearchParams = await searchParams;
  const workspace = await getGroupWorkspace(groupId);
  const toast = readToast(resolvedSearchParams);

  if (!workspace) {
    notFound();
  }

  const achievedMemberCount = workspace.members.filter((member) =>
    workspace.group.weeklyGoalType === "days"
      ? member.daysReadThisWeek >= workspace.group.weeklyGoalValue
      : member.totalPagesThisWeek >= workspace.group.weeklyGoalValue,
  ).length;
  return (
    <div className="space-y-6">
      {toast ? (
        <Toast
          description={toast.description}
          title={toast.title}
          tone={toast.tone}
        />
      ) : null}

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px] lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="space-y-5">
          <p className="type-headline text-label-strong">멤버 순위</p>
          <div className="space-y-4">
            {workspace.weeklyOverview.ranking.map((entry, index) => (
              <div key={entry.member.id} className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-fill-normal type-caption text-label-assistive tabular-nums">
                      {index + 1}
                    </div>
                    <div>
                      <p className="type-label text-label-strong">
                        {entry.member.nickname}
                      </p>
                      <p className="type-caption text-label-assistive">
                        {entry.days}일 읽음
                      </p>
                    </div>
                  </div>
                  <p className="type-label text-label-strong tabular-nums">
                    {formatPages(entry.pages)}
                  </p>
                </div>
                <ProgressBar
                  value={
                    workspace.weeklyOverview.ranking[0]?.pages
                      ? (entry.pages / workspace.weeklyOverview.ranking[0].pages) *
                        100
                      : 0
                  }
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-5">
          <p className="type-headline text-label-strong">이번 주 요약</p>
          <div className="space-y-3">
            <div className="rounded-2xl bg-fill-alternative p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="type-label text-label-assistive">총 독서 기록</p>
                <p className="type-label text-label-strong tabular-nums">
                  {workspace.weeklyOverview.totalLogs}회
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-fill-alternative p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="type-label text-label-assistive">총 읽은 페이지</p>
                <p className="type-label text-label-strong tabular-nums">
                  {formatPages(workspace.weeklyOverview.totalPages)}
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-fill-alternative p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="type-label text-label-assistive">목표 달성</p>
                <p className="type-label text-label-strong tabular-nums">
                  {achievedMemberCount}명/{workspace.members.length}명
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
