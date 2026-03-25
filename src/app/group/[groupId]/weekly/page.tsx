import { notFound } from "next/navigation";
import { WeeklyHistoryAccordion } from "@/components/domain/weekly-history-accordion";
import { Card } from "@/components/ui/card";
import { getGroupWorkspace } from "@/lib/data/queries";
import type { WeeklyOverview } from "@/lib/types";
import { formatGoal, formatPages } from "@/lib/utils";

interface WeeklyPageProps {
  params: Promise<{ groupId: string }>;
}

function WeeklySummaryCard({
  overview,
  goalLabel,
  memberCount,
}: {
  overview: WeeklyOverview;
  goalLabel: string;
  memberCount: number;
}) {
  return (
    <Card elevated className="surface-soft space-y-4">
      <div className="space-y-1">
        <p className="type-headline text-label-strong">이번 주 요약</p>
        <p className="type-caption text-label-assistive">목표 · {goalLabel}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-fill-alternative p-4">
          <p className="type-caption text-label-assistive">총 독서 기록</p>
          <p className="mt-1 type-label text-label-strong tabular-nums">
            {overview.totalLogs}회
          </p>
        </div>
        <div className="rounded-2xl bg-fill-alternative p-4">
          <p className="type-caption text-label-assistive">총 읽은 페이지</p>
          <p className="mt-1 type-label text-label-strong tabular-nums">
            {formatPages(overview.totalPages)}
          </p>
        </div>
        <div className="rounded-2xl bg-fill-alternative p-4">
          <p className="type-caption text-label-assistive">목표 달성</p>
          <p className="mt-1 type-label text-label-strong tabular-nums">
            {overview.achievedMemberCount}명/{memberCount}명
          </p>
        </div>
      </div>
    </Card>
  );
}

export default async function WeeklyPage({
  params,
}: WeeklyPageProps) {
  const { groupId } = await params;
  const workspace = await getGroupWorkspace(groupId);

  if (!workspace) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <WeeklySummaryCard
        goalLabel={formatGoal(
          workspace.group.weeklyGoalType,
          workspace.group.weeklyGoalValue,
        )}
        memberCount={workspace.members.length}
        overview={workspace.weeklyOverview}
      />

      <WeeklyHistoryAccordion
        goalType={workspace.group.weeklyGoalType}
        goalValue={workspace.group.weeklyGoalValue}
        memberCount={workspace.members.length}
        weeks={workspace.weeklyOverview.weeks}
      />
    </div>
  );
}
