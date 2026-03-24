import Link from "next/link";
import { ReadingDaysStrip } from "@/components/domain/reading-days-strip";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import type { MemberSummary } from "@/lib/types";
import { formatMemberRole, formatPages } from "@/lib/utils";

interface MemberCardProps {
  groupId: string;
  member: MemberSummary;
  selected?: boolean;
}

export function MemberCard({
  groupId,
  member,
  selected = false,
}: MemberCardProps) {
  return (
    <Card
      interactive
      className={`min-h-0 overflow-hidden p-0 ${selected ? "border-primary/35 shadow-sm" : ""}`}
    >
      <Link
        className="block p-4"
        href={`/group/${groupId}/members?member=${member.userId}`}
        scroll={false}
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar
                avatarUrl={member.avatarUrl}
                name={member.nickname}
                size="sm"
                tone={member.avatarColor}
              />
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <p
                    className="truncate type-label text-label-strong"
                    title={member.nickname}
                  >
                    {member.nickname}
                  </p>
                  {member.role === "owner" ? (
                    <Chip tone="primary">{formatMemberRole(member.role)}</Chip>
                  ) : null}
                </div>
                <p className="truncate type-caption text-label-assistive">
                  {formatPages(member.totalPagesThisWeek)} · 읽는 책 {member.activeBooks.length}권
                </p>
              </div>
            </div>

            <div className="shrink-0 rounded-full bg-fill-alternative px-3 py-1.5 text-[11px] font-medium leading-none text-label-strong tabular-nums">
              이번 주 {member.daysReadThisWeek}일
            </div>
          </div>

          <ReadingDaysStrip
            className="gap-1.5"
            compact
            days={member.weeklyReadDays}
          />
        </div>
      </Link>
    </Card>
  );
}
