import Link from "next/link";
import { JoinGroupForm } from "@/components/forms/join-group-form";
import { Brand } from "@/components/layout/brand";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { DEMO_INVITE_CODE } from "@/lib/constants";
import { getInvitePreview } from "@/lib/data/queries";
import { formatGoal } from "@/lib/utils";

export default async function JoinGroupPage() {
  const preview = await getInvitePreview(DEMO_INVITE_CODE);

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1120px] px-4 py-10 sm:px-5 lg:py-14">
      <div className="mb-8 flex items-center justify-between">
        <Brand />
        <Link
          className={buttonStyles({ size: "sm", variant: "ghost" })}
          href="/"
        >
          처음으로
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card elevated className="space-y-6">
          <div className="space-y-2">
            <p className="type-caption uppercase tracking-[0.16em] text-label-assistive">
              모임 참여
            </p>
            <h1 className="type-title2 text-label-strong">초대 코드 입력</h1>
          </div>
          <JoinGroupForm defaultCode={DEMO_INVITE_CODE} />
        </Card>

        <div className="space-y-4">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="type-caption uppercase tracking-[0.16em] text-label-assistive">
                모임 미리 보기
              </p>
              <Chip tone="positive">유효한 코드</Chip>
            </div>
            {preview ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h2 className="type-heading1 text-label-strong">
                    {preview.name}
                  </h2>
                  <p className="type-body text-label-alternative">
                    {preview.description}
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="rounded-lg bg-fill-alternative p-4">
                    <p className="type-caption text-label-assistive">멤버</p>
                    <p className="mt-1 type-label text-label-strong">
                      {preview.memberCount}
                    </p>
                  </div>
                  <div className="rounded-lg bg-fill-alternative p-4">
                    <p className="type-caption text-label-assistive">
                      주간 목표
                    </p>
                    <p className="mt-1 type-label text-label-strong">
                      {formatGoal(preview.weeklyGoalType, preview.weeklyGoalValue)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="type-body text-label-alternative">
                코드를 확인해 주세요.
              </p>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}
