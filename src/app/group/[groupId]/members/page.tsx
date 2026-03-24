import { notFound } from "next/navigation";
import { MobileMemberAccordionList } from "@/components/domain/mobile-member-accordion-list";
import { MemberCard } from "@/components/domain/member-card";
import { ReadingDaysStrip } from "@/components/domain/reading-days-strip";
import { ReadingLogCard } from "@/components/domain/reading-log-card";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Toast } from "@/components/ui/toast";
import { getGroupWorkspace } from "@/lib/data/queries";
import { getStringParam, readToast } from "@/lib/toast";
import type { MemberSummary } from "@/lib/types";
import { formatMemberRole, formatPages } from "@/lib/utils";

interface MembersPageProps {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function MemberSummaryStats({
  member,
  className,
}: {
  member: MemberSummary;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="rounded-2xl bg-fill-alternative p-4">
        <p className="type-caption text-label-assistive">읽은 날</p>
        <p className="mt-1 type-label text-label-strong">{member.daysReadThisWeek}일</p>
      </div>
      <div className="rounded-2xl bg-fill-alternative p-4">
        <p className="type-caption text-label-assistive">읽은 페이지</p>
        <p className="mt-1 type-label text-label-strong">
          {formatPages(member.totalPagesThisWeek)}
        </p>
      </div>
      <div className="rounded-2xl bg-fill-alternative p-4">
        <p className="type-caption text-label-assistive">읽는 책</p>
        <p className="mt-1 type-label text-label-strong">
          {member.activeBooks.length}권
        </p>
      </div>
    </div>
  );
}

function MemberDetailPanel({ member }: { member: MemberSummary }) {
  return (
    <div className="space-y-4">
      <Card className="space-y-5">
        <div className="flex items-start gap-3">
          <Avatar
            avatarUrl={member.avatarUrl}
            name={member.nickname}
            size="lg"
            tone={member.avatarColor}
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="type-headline text-label-strong">{member.nickname}</p>
              {member.role === "owner" ? (
                <Chip tone="primary">{formatMemberRole(member.role)}</Chip>
              ) : null}
            </div>
            <p className="type-caption text-label-assistive">
              이번 주 {member.daysReadThisWeek}일 읽음
            </p>
          </div>
        </div>

        <ReadingDaysStrip days={member.weeklyReadDays} />

        <MemberSummaryStats className="grid gap-3 sm:grid-cols-3" member={member} />
      </Card>

      <Card className="space-y-4">
        <p className="type-headline text-label-strong">읽는 중인 책</p>

        {member.activeBooks.length ? (
          <div className="space-y-3">
            {member.activeBooks.map((book) => (
              <div key={book.id} className="rounded-2xl bg-fill-alternative p-4">
                <p className="type-label text-label-strong">{book.title}</p>
                <p className="mt-1 type-caption text-label-alternative">
                  {book.author}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-fill-alternative p-4">
            <p className="type-body text-label-alternative">읽는 중인 책이 없습니다.</p>
          </div>
        )}
      </Card>

      <div className="space-y-3">
        <p className="type-headline text-label-strong">최근 기록</p>
        {member.recentLogs.length ? (
          member.recentLogs.map((log) => <ReadingLogCard key={log.id} log={log} />)
        ) : (
          <div className="rounded-2xl border border-line-solid bg-bg-normal p-5">
            <p className="type-body text-label-alternative">최근 기록이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default async function MembersPage({
  params,
  searchParams,
}: MembersPageProps) {
  const { groupId } = await params;
  const resolvedSearchParams = await searchParams;
  const selectedMemberId = getStringParam(resolvedSearchParams, "member");
  const toast = readToast(resolvedSearchParams);
  const workspace = await getGroupWorkspace(groupId);

  if (!workspace) {
    notFound();
  }

  const selectedMember =
    workspace.members.find((member) => member.userId === selectedMemberId) ??
    workspace.members.find((member) => member.userId === workspace.me.id) ??
    workspace.members[0];

  return (
    <div className="space-y-6">
      {toast ? (
        <Toast
          description={toast.description}
          title={toast.title}
          tone={toast.tone}
        />
      ) : null}

      <div className="grid gap-6 min-[720px]:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)]">
        <MobileMemberAccordionList members={workspace.members} />

        <div className="hidden space-y-3 min-[720px]:block">
          {workspace.members.map((member) => (
            <MemberCard
              key={member.id}
              groupId={groupId}
              member={member}
              selected={member.userId === selectedMember.userId}
            />
          ))}
        </div>

        <div className="hidden min-[720px]:block min-[720px]:sticky min-[720px]:top-24">
          <MemberDetailPanel member={selectedMember} />
        </div>
      </div>
    </div>
  );
}
