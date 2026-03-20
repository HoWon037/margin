import Link from "next/link";
import { CreateGroupForm } from "@/components/forms/create-group-form";
import { Brand } from "@/components/layout/brand";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";

export default function CreateGroupPage() {
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
              모임 만들기
            </p>
            <h1 className="type-title2 text-label-strong">새 모임 만들기</h1>
          </div>
          <CreateGroupForm />
        </Card>

        <div className="space-y-4">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="type-caption uppercase tracking-[0.16em] text-label-assistive">
                미리보기
              </p>
              <Chip tone="primary">비공개</Chip>
            </div>
            <div className="space-y-2">
              <h2 className="type-heading1 text-label-strong">여백 독서모임</h2>
            </div>
            <div className="grid gap-3">
              <div className="rounded-lg bg-fill-alternative p-4">
                <p className="type-caption text-label-assistive">주간 목표</p>
                <p className="mt-1 type-label text-label-strong">
                  일주일에 3일 읽기
                </p>
              </div>
              <div className="rounded-lg bg-fill-alternative p-4">
                <p className="type-caption text-label-assistive">초대 방식</p>
                <p className="mt-1 type-label text-label-strong">
                  생성 후 코드 발급
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
