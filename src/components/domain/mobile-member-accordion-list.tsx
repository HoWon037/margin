"use client";

import { useState } from "react";
import { ReadingDaysStrip } from "@/components/domain/reading-days-strip";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import type { MemberSummary } from "@/lib/types";
import { formatMemberRole, formatPages } from "@/lib/utils";

interface MobileMemberAccordionListProps {
  members: MemberSummary[];
}

export function MobileMemberAccordionList({
  members,
}: MobileMemberAccordionListProps) {
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);

  return (
    <div className="space-y-3 min-[720px]:hidden">
      {members.map((member) => {
        const open = openMemberId === member.userId;

        return (
          <Card
            key={member.id}
            interactive
            className={`overflow-hidden p-0 transition-[border-color,box-shadow] duration-300 ${
              open ? "border-primary/35 shadow-sm" : ""
            }`}
          >
            <button
              aria-expanded={open}
              className="w-full p-4 text-left"
              onClick={() => setOpenMemberId(open ? null : member.userId)}
              type="button"
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

                  <div className="flex items-center gap-2">
                    <div className="shrink-0 rounded-full bg-fill-alternative px-3 py-1.5 text-[11px] font-medium leading-none text-label-strong tabular-nums">
                      이번 주 {member.daysReadThisWeek}일
                    </div>
                    <span
                      aria-hidden="true"
                      className={`flex h-7 w-7 items-center justify-center rounded-full bg-fill-alternative text-label-assistive transition-[transform,color] duration-300 ${
                        open ? "rotate-180 text-label-strong" : ""
                      }`}
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 14 14"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3 5.5L7 9l4-3.5"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.4"
                        />
                      </svg>
                    </span>
                  </div>
                </div>

                <ReadingDaysStrip
                  className="gap-1.5"
                  compact
                  days={member.weeklyReadDays}
                />
              </div>
            </button>

            <div
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="grid gap-3 border-t border-line-normal/60 px-4 pt-3 pb-4 sm:hidden">
                  <div className="rounded-2xl bg-fill-alternative p-4">
                    <p className="type-caption text-label-assistive">읽은 날</p>
                    <p className="mt-1 type-label text-label-strong">
                      {member.daysReadThisWeek}일
                    </p>
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
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
