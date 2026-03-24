import { JoinGroupForm } from "@/components/forms/join-group-form";
import { Brand } from "@/components/layout/brand";
import { Card } from "@/components/ui/card";

export default function JoinGroupPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[880px] px-4 py-10 sm:px-5 lg:py-14">
      <div className="mb-8">
        <Brand />
      </div>

      <Card elevated className="mx-auto max-w-[560px] space-y-6 rounded-[24px] px-5 py-6 sm:px-6 sm:py-7">
        <div className="space-y-2">
          <p className="type-caption uppercase tracking-[0.16em] text-label-assistive">
            모임 들어가기
          </p>
          <h1 className="type-title2 text-label-strong">초대 코드 입력</h1>
          <p className="type-body text-label-alternative">
            받은 초대 코드를 입력하면 바로 모임에 들어갈 수 있습니다.
          </p>
        </div>
        <JoinGroupForm />
      </Card>
    </main>
  );
}
