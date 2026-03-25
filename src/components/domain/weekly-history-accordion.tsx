"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import type { GoalType, WeeklyOverview } from "@/lib/types";
import { formatPages } from "@/lib/utils";

interface WeeklyHistoryAccordionProps {
  goalType: GoalType;
  goalValue: number;
  memberCount: number;
  weeks: WeeklyOverview["weeks"];
}

function formatCompactDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}.${Number(day)}`;
}

function formatWeekValue(goalType: GoalType, days: number, pages: number) {
  return goalType === "days" ? `${days}일` : formatPages(pages);
}

function formatGoalValue(goalType: GoalType, goalValue: number) {
  return goalType === "days" ? `${goalValue}일` : formatPages(goalValue);
}

export function WeeklyHistoryAccordion({
  goalType,
  goalValue,
  memberCount,
  weeks,
}: WeeklyHistoryAccordionProps) {
  const [openWeekId, setOpenWeekId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {weeks.map((week) => {
        const open = openWeekId === week.id;

        return (
          <Card key={week.id} className="overflow-hidden p-0">
            <button
              aria-expanded={open}
              className="flex w-full items-start justify-between gap-4 p-5 text-left transition-colors duration-300 sm:p-6"
              onClick={() => setOpenWeekId(open ? null : week.id)}
              type="button"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="type-headline text-label-strong">{week.weekNumber}주차</p>
                  {week.isCurrentWeek ? (
                    <span className="type-caption text-label-assistive">(이번 주)</span>
                  ) : null}
                </div>
                <p className="type-caption text-label-assistive">
                  {formatCompactDate(week.startDate)}~{formatCompactDate(week.endDate)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Chip tone={week.achievedMemberCount > 0 ? "primary" : "neutral"}>
                  {week.achievedMemberCount}명/{memberCount}명
                </Chip>
                <span
                  aria-hidden="true"
                  className={`flex h-8 w-8 items-center justify-center rounded-full bg-fill-alternative text-label-assistive transition-[transform,color] duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    open ? "rotate-180 text-label-strong" : ""
                  }`}
                >
                  <svg
                    className="h-4 w-4"
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
            </button>

            <div
              className={`grid transition-[grid-template-rows,opacity] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div
                  className={`space-y-2 px-5 pb-5 transition-[transform,opacity] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-6 sm:pb-6 ${
                    open ? "translate-y-0 opacity-100" : "-translate-y-1.5 opacity-0"
                  }`}
                >
                  {week.members.map((entry) => (
                    <div
                      key={`${week.id}-${entry.member.id}`}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-fill-alternative px-4 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar
                          avatarUrl={entry.member.avatarUrl}
                          name={entry.member.nickname}
                          size="sm"
                          tone={entry.member.avatarColor}
                        />
                        <div className="min-w-0">
                          <p className="truncate type-label text-label-strong">
                            {entry.member.nickname}
                          </p>
                          <p className="truncate type-caption text-label-assistive">
                            {formatWeekValue(goalType, entry.days, entry.pages)} · 목표{" "}
                            {formatGoalValue(goalType, goalValue)}
                          </p>
                        </div>
                      </div>
                      <Chip tone={entry.achieved ? "positive" : "cautionary"}>
                        {entry.achieved ? "달성" : "미달성"}
                      </Chip>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
