import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import type { GroupDirectoryItem } from "@/lib/types";
import { formatGoal, formatMemberRole } from "@/lib/utils";

export function GroupDirectoryCard({
  item,
  highlight = false,
}: {
  item: GroupDirectoryItem;
  highlight?: boolean;
}) {
  return (
    <Link className="block" href={`/group/${item.group.id}`}>
      <Card
        interactive
        className={highlight ? "border-primary/35 shadow-sm" : ""}
      >
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="type-headline text-label-strong">{item.group.name}</p>
              {item.group.description ? (
                <p className="type-body text-label-alternative">
                  {item.group.description}
                </p>
              ) : null}
            </div>
            <Chip tone={item.role === "owner" ? "primary" : "neutral"}>
              {formatMemberRole(item.role)}
            </Chip>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-fill-alternative p-4">
              <p className="type-caption text-label-assistive">멤버</p>
              <p className="mt-1 type-label text-label-strong">
                {item.group.memberCount}
              </p>
            </div>
            <div className="rounded-2xl bg-fill-alternative p-4">
              <p className="type-caption text-label-assistive">주간 목표</p>
              <p className="mt-1 type-label-reading text-label-strong">
                {formatGoal(
                  item.group.weeklyGoalType,
                  item.group.weeklyGoalValue,
                )}
              </p>
            </div>
            <div className="rounded-2xl bg-fill-alternative p-4">
              <p className="type-caption text-label-assistive">초대 코드</p>
              <p className="mt-1 type-label text-label-strong">
                {item.group.inviteCode}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
