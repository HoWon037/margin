import Link from "next/link";
import { GroupDirectoryCard } from "@/components/domain/group-directory-card";
import { ProfileLink } from "@/components/layout/profile-link";
import { Avatar } from "@/components/ui/avatar";
import { buttonStyles } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Toast } from "@/components/ui/toast";
import { DEMO_GROUP_ID } from "@/lib/constants";
import { getLandingWorkspace } from "@/lib/data/queries";
import { getGroupDirectory } from "@/lib/data/queries";
import { readToast } from "@/lib/toast";

interface GroupsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function GroupsPage({ searchParams }: GroupsPageProps) {
  const resolvedSearchParams = await searchParams;
  const toast = readToast(resolvedSearchParams);
  const directory = await getGroupDirectory();
  const previewWorkspace = !directory.user && directory.isDemoMode
    ? await getLandingWorkspace()
    : null;
  const isPreviewMode = !directory.user && directory.isDemoMode;
  const displayUser = directory.user ?? previewWorkspace?.me ?? null;
  const heading = isPreviewMode
    ? "모임 둘러보기"
    : displayUser
      ? "내 모임"
      : "모임";
  const description = isPreviewMode
    ? "연결 전에도 실제 사용에 가까운 목록 화면을 먼저 확인할 수 있습니다."
    : displayUser
      ? "참여 중인 모임을 열거나 새 모임을 만들 수 있습니다."
      : "로그인 후 모임을 확인해 주세요.";
  const profileHref = "/profile?returnTo=%2Fgroups";
  const displayGroups =
    directory.groups.length > 0
      ? directory.groups
      : previewWorkspace
        ? [
            {
              role: "owner" as const,
              joinedAt: new Date().toISOString(),
              group: directory.demoGroup ?? {
                id: DEMO_GROUP_ID,
                name: previewWorkspace.group.name,
                description: previewWorkspace.group.description,
                weeklyGoalType: previewWorkspace.group.weeklyGoalType,
                weeklyGoalValue: previewWorkspace.group.weeklyGoalValue,
                inviteCode: previewWorkspace.group.inviteCode,
                ownerId: previewWorkspace.group.ownerId,
                memberCount: previewWorkspace.group.memberCount,
                createdAt: previewWorkspace.group.createdAt,
              },
            },
          ]
        : [];

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1120px] px-4 py-10 sm:px-5 lg:py-14">
      <div className="space-y-6">
        {(displayUser || directory.user) ? (
          <div className="flex items-center gap-4">
            {directory.user && displayUser ? (
              <ProfileLink href={profileHref} user={displayUser} />
            ) : displayUser ? (
              <div className="chrome-surface inline-flex min-w-0 items-center gap-3 rounded-full border border-line-solid/90 px-2.5 py-2 shadow-xs">
                <Avatar
                  avatarUrl={displayUser.avatarUrl}
                  name={displayUser.nickname}
                  size="sm"
                  tone={displayUser.avatarColor}
                />
                <p className="truncate type-label text-label-strong">
                  {displayUser.nickname}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="chrome-surface flex flex-col gap-5 rounded-[24px] border border-line-solid p-5 shadow-xs sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              {!displayUser ? (
                <div className="flex items-center gap-3">
                  <Chip tone="neutral">로그아웃 상태</Chip>
                  {isPreviewMode ? <Chip tone="primary">미리보기</Chip> : null}
                </div>
              ) : isPreviewMode ? (
                <div className="flex items-center gap-3">
                  <Chip tone="primary">미리보기</Chip>
                </div>
              ) : null}

              <div className="space-y-1">
                <h1 className="type-title2 text-label-strong">{heading}</h1>
                <p className="max-w-[48ch] type-body text-label-alternative">
                  {description}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {directory.user ? (
                <>
                  <Link
                    className={buttonStyles({ size: "md", variant: "secondary" })}
                    href="/join"
                  >
                    모임 들어가기
                  </Link>
                  <Link
                    className={buttonStyles({ size: "md", variant: "primary" })}
                    href="/create-group"
                  >
                    모임 만들기
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    className={buttonStyles({ size: "md", variant: "secondary" })}
                    href="/join"
                  >
                    모임 들어가기
                  </Link>
                  <Link
                    className={buttonStyles({ size: "md", variant: "primary" })}
                    href="/create-group"
                  >
                    모임 만들기
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {toast ? (
          <Toast
            description={toast.description}
            title={toast.title}
            tone={toast.tone}
          />
        ) : null}

        {displayGroups.length ? (
          <section className="space-y-4">
            <div className="space-y-1">
              <p className="type-label text-label-assistive">
                {isPreviewMode ? "미리보기 모임" : "참여 중인 모임"}
              </p>
              <h2 className="type-headline text-label-strong">
                {displayGroups.length}개의 모임
              </h2>
            </div>
            <div className="space-y-4">
              {displayGroups.map((item, index) => (
                <GroupDirectoryCard
                  key={item.group.id}
                  highlight={index === 0}
                  item={item}
                />
              ))}
            </div>
          </section>
        ) : directory.user ? (
          <EmptyState
            description=""
            title="아직 참여한 모임이 없습니다"
          />
        ) : (
          <EmptyState
            actionHref="/join"
            actionLabel="모임 들어가기"
            secondaryHref="/create-group"
            secondaryLabel="모임 만들기"
            description="로그인 후 다시 확인해 주세요."
            title="로그인 정보가 없습니다"
          />
        )}
      </div>
    </main>
  );
}
