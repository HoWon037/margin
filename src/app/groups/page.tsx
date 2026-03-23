import Link from "next/link";
import { signOutAction } from "@/app/actions";
import { GroupDirectoryCard } from "@/components/domain/group-directory-card";
import { ProfileLink } from "@/components/layout/profile-link";
import { buttonStyles } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Toast } from "@/components/ui/toast";
import { DEMO_GROUP_ID } from "@/lib/constants";
import { getGroupDirectory } from "@/lib/data/queries";
import { readToast } from "@/lib/toast";

interface GroupsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function GroupsPage({ searchParams }: GroupsPageProps) {
  const resolvedSearchParams = await searchParams;
  const toast = readToast(resolvedSearchParams);
  const directory = await getGroupDirectory();

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1120px] px-4 py-10 sm:px-5 lg:py-14">
      <div className="space-y-5">
        <div className="chrome-surface flex flex-col gap-4 rounded-xl border border-line-solid p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {directory.user ? (
              <ProfileLink href="/profile?returnTo=/groups" user={directory.user} />
            ) : (
              <Chip tone={directory.isDemoMode ? "cautionary" : "neutral"}>
                {directory.isDemoMode ? "데모 모드" : "로그아웃 상태"}
              </Chip>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className={buttonStyles({ size: "md", variant: "secondary" })}
              href="/join"
            >
              모임 참여
            </Link>
            <Link
              className={buttonStyles({ size: "md", variant: "primary" })}
              href="/create-group"
            >
              모임 만들기
            </Link>
            {directory.user ? (
              <form action={signOutAction}>
                <button
                  className={buttonStyles({ size: "md", variant: "ghost" })}
                  type="submit"
                >
                  로그아웃
                </button>
              </form>
            ) : (
              <Link
                className={buttonStyles({ size: "md", variant: "ghost" })}
                href="/"
              >
                처음으로
              </Link>
            )}
          </div>
        </div>

        {toast ? (
          <Toast
            description={toast.description}
            title={toast.title}
            tone={toast.tone}
          />
        ) : null}

        {directory.groups.length ? (
          <section className="space-y-4">
            <h1 className="type-title2 text-label-strong">내 모임</h1>
            <div className="space-y-4">
              {directory.groups.map((item, index) => (
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
            actionHref="/create-group"
            actionLabel="첫 모임 만들기"
            description="계정은 준비되어 있지만 아직 속한 독서모임이 없습니다."
            secondaryHref="/join"
            secondaryLabel="코드로 참여하기"
            title="아직 참여한 모임이 없습니다"
          />
        ) : directory.isDemoMode ? (
          <section className="space-y-4">
            <h1 className="type-title2 text-label-strong">데모 모임</h1>
            <GroupDirectoryCard
              highlight
              item={{
                role: "owner",
                joinedAt: new Date().toISOString(),
                group: directory.demoGroup ?? {
                  id: DEMO_GROUP_ID,
                  name: "여백 독서모임",
                  description: "데모 모임",
                  weeklyGoalType: "days",
                  weeklyGoalValue: 3,
                  inviteCode: "MARGIN7",
                  ownerId: "demo-user",
                  memberCount: 10,
                  createdAt: new Date().toISOString(),
                },
              }}
            />
          </section>
        ) : (
          <EmptyState
            actionHref="/"
            actionLabel="처음으로 가기"
            description="로그인 후 다시 확인해 주세요."
            title="로그인 정보가 없습니다"
          />
        )}
      </div>
    </main>
  );
}
