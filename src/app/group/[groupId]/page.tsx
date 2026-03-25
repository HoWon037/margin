import Link from "next/link";
import { notFound } from "next/navigation";
import { ReadingLogActionsMenu } from "@/components/domain/reading-log-actions-menu";
import { ReadingLogCard } from "@/components/domain/reading-log-card";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";
import { getGroupWorkspace } from "@/lib/data/queries";
import { getStringParam } from "@/lib/toast";
import { formatPages } from "@/lib/utils";

interface GroupHomePageProps {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const LOGS_PER_PAGE = 15;

function buildFeedHref(groupId: string, view: "group" | "mine", page: number) {
  const params = new URLSearchParams();

  if (view === "mine") {
    params.set("view", "mine");
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `/group/${groupId}?${query}` : `/group/${groupId}`;
}

function getPaginationPages(totalPages: number, currentPage: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, 5];
  }

  if (currentPage >= totalPages - 2) {
    return [
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    currentPage - 2,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    currentPage + 2,
  ];
}

function formatWeeklyRecordSummary(
  goalType: "days" | "pages",
  goalValue: number,
  daysReadThisWeek: number,
  pagesThisWeek: number,
  withGoal: boolean,
) {
  if (goalType === "days") {
    return withGoal
      ? `이번 주 기록: ${daysReadThisWeek}일/${goalValue}일 · ${formatPages(pagesThisWeek)}`
      : `이번 주 기록: ${daysReadThisWeek}일 · ${formatPages(pagesThisWeek)}`;
  }

  return withGoal
    ? `이번 주 기록: ${pagesThisWeek}/${goalValue}페이지`
    : `이번 주 기록: ${formatPages(pagesThisWeek)}`;
}

export default async function GroupHomePage({
  params,
  searchParams,
}: GroupHomePageProps) {
  const { groupId } = await params;
  const resolvedSearchParams = await searchParams;
  const workspace = await getGroupWorkspace(groupId);
  const logView = getStringParam(resolvedSearchParams, "view") === "mine" ? "mine" : "group";
  const pageParam = Number(getStringParam(resolvedSearchParams, "page") ?? "1");

  if (!workspace) {
    notFound();
  }

  const myLogs = workspace.recentLogs.filter((log) => log.member.id === workspace.me.id);
  const visibleLogs = logView === "mine" ? myLogs : workspace.recentLogs;
  const totalPages = Math.max(1, Math.ceil(visibleLogs.length / LOGS_PER_PAGE));
  const currentPage = Number.isFinite(pageParam)
    ? Math.min(totalPages, Math.max(1, Math.floor(pageParam)))
    : 1;
  const visiblePages = getPaginationPages(totalPages, currentPage);
  const paginatedLogs = visibleLogs.slice(
    (currentPage - 1) * LOGS_PER_PAGE,
    currentPage * LOGS_PER_PAGE,
  );
  const mobileSummary = formatWeeklyRecordSummary(
    workspace.group.weeklyGoalType,
    workspace.group.weeklyGoalValue,
    workspace.personalSummary.daysReadThisWeek,
    workspace.personalSummary.pagesThisWeek,
    true,
  );
  const desktopSummary = formatWeeklyRecordSummary(
    workspace.group.weeklyGoalType,
    workspace.group.weeklyGoalValue,
    workspace.personalSummary.daysReadThisWeek,
    workspace.personalSummary.pagesThisWeek,
    false,
  );

  return (
    <div className="space-y-5">
      <Card elevated className="surface-soft space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`inline-flex h-9 items-center rounded-[14px] border px-3 text-[12px] font-medium sm:h-10 sm:px-3.5 sm:text-[13px] ${
              workspace.hasLoggedToday
                ? "border-positive/18 bg-positive/12 text-positive"
                : "border-cautionary/18 bg-cautionary/12 text-cautionary"
            }`}
          >
            {workspace.hasLoggedToday ? "오늘 기록함" : "기록 대기"}
          </div>
          <div className="inline-flex h-9 items-center rounded-[14px] border border-line-solid bg-fill-alternative px-3 text-[12px] font-medium text-label-strong tabular-nums sm:h-10 sm:px-3.5 sm:text-[13px]">
            <span className="md:hidden">{mobileSummary}</span>
            <span className="hidden md:inline">{desktopSummary}</span>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_176px] md:items-end">
          <div className="space-y-2">
            <h2 className="text-[1.125rem] leading-7 font-semibold tracking-[-0.022em] text-label-strong sm:text-[1.25rem] sm:leading-8 md:text-[1.375rem] md:leading-8">
              {workspace.todayPrompt}
            </h2>
          </div>

          <Link
            className={buttonStyles({
              block: true,
              className: "h-12 rounded-[18px] shadow-none sm:h-[52px]",
              size: "lg",
            })}
            href={`/group/${groupId}/log`}
          >
            기록하기
          </Link>
        </div>
      </Card>

      <section className="space-y-4">
        <Tabs
          items={[
            {
              label: `모임 기록 ${workspace.recentLogs.length}`,
              href: buildFeedHref(groupId, "group", 1),
              active: logView === "group",
            },
            {
              label: `내 기록 ${myLogs.length}`,
              href: buildFeedHref(groupId, "mine", 1),
              active: logView === "mine",
            },
          ]}
        />
        {paginatedLogs.length ? (
          <div className="space-y-4">
            {paginatedLogs.map((log) => (
              <ReadingLogCard
                key={log.id}
                actions={
                  log.member.id === workspace.me.id ? (
                    <ReadingLogActionsMenu groupId={groupId} logId={log.id} />
                  ) : undefined
                }
                log={log}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            description="아직 남긴 기록이 없습니다."
            title="표시할 기록이 없습니다"
          />
        )}
        {visibleLogs.length > LOGS_PER_PAGE ? (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 tabular-nums">
            <Link
              aria-disabled={currentPage === 1}
              tabIndex={currentPage === 1 ? -1 : undefined}
              className={buttonStyles({
                className: currentPage === 1 ? "pointer-events-none opacity-40" : "",
                size: "sm",
                variant: "secondary",
              })}
              href={buildFeedHref(groupId, logView, 1)}
            >
              {"<<"}
            </Link>
            <Link
              aria-disabled={currentPage === 1}
              tabIndex={currentPage === 1 ? -1 : undefined}
              className={buttonStyles({
                className: currentPage === 1 ? "pointer-events-none opacity-40" : "",
                size: "sm",
                variant: "secondary",
              })}
              href={buildFeedHref(
                groupId,
                logView,
                currentPage === 1 ? 1 : currentPage - 1,
              )}
            >
              {"<"}
            </Link>
            {visiblePages.map((page) => (
              <Link
                key={page}
                aria-current={currentPage === page ? "page" : undefined}
                className={buttonStyles({
                  className: currentPage === page ? "border-primary/20 bg-primary/10 text-primary" : "",
                  size: "sm",
                  variant: "secondary",
                })}
                href={buildFeedHref(groupId, logView, page)}
              >
                {page}
              </Link>
            ))}
            <Link
              aria-disabled={currentPage === totalPages}
              tabIndex={currentPage === totalPages ? -1 : undefined}
              className={buttonStyles({
                className:
                  currentPage === totalPages ? "pointer-events-none opacity-40" : "",
                size: "sm",
                variant: "secondary",
              })}
              href={buildFeedHref(
                groupId,
                logView,
                currentPage === totalPages ? totalPages : currentPage + 1,
              )}
            >
              {">"}
            </Link>
            <Link
              aria-disabled={currentPage === totalPages}
              tabIndex={currentPage === totalPages ? -1 : undefined}
              className={buttonStyles({
                className:
                  currentPage === totalPages ? "pointer-events-none opacity-40" : "",
                size: "sm",
                variant: "secondary",
              })}
              href={buildFeedHref(groupId, logView, totalPages)}
            >
              {">>"}
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}
