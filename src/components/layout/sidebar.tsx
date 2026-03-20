"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card } from "@/components/ui/card";
import { getGroupNavigation } from "@/lib/constants";
import type { GroupSummary } from "@/lib/types";
import { formatGoal } from "@/lib/utils";

interface SidebarProps {
  group: GroupSummary;
}

export function Sidebar({ group }: SidebarProps) {
  const pathname = usePathname();
  const navItems = getGroupNavigation(group.id).map((item) => ({
    ...item,
    active: item.href === pathname,
  }));

  return (
    <div className="sticky top-24 space-y-4">
      <Card className="space-y-1 p-3">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              className={`flex items-center justify-between rounded-xl px-3 py-3 type-label transition ${
                item.active
                  ? "bg-fill-strong text-label-strong"
                  : "text-label-alternative md:hover:bg-fill-normal md:hover:text-label-strong"
              }`}
              href={item.href}
            >
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="space-y-5">
        <div className="space-y-1.5">
          <p className="type-headline text-label-strong">{group.name}</p>
          {group.description ? (
            <p className="type-body text-label-alternative">{group.description}</p>
          ) : null}
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl bg-fill-alternative p-4">
            <p className="type-caption text-label-assistive">주간 목표</p>
            <p className="mt-1 type-label text-label-strong">
              {formatGoal(group.weeklyGoalType, group.weeklyGoalValue)}
            </p>
          </div>
          <div className="rounded-2xl bg-fill-alternative p-4">
            <p className="type-caption text-label-assistive">멤버</p>
            <p className="mt-1 type-label text-label-strong">{group.memberCount}명</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
