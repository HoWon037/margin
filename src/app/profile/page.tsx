import { redirect } from "next/navigation";
import { signOutAction } from "@/app/actions";
import { ProfileForm } from "@/components/forms/profile-form";
import { buttonStyles } from "@/components/ui/button";
import { getCurrentUserSummary } from "@/lib/data/queries";

export default async function ProfilePage() {
  const user = await getCurrentUserSummary();

  if (!user) {
    redirect("/");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[760px] px-4 py-10 sm:px-5 lg:py-14">
      <div className="space-y-6">
        <h1 className="type-title2 text-label-strong">내 정보</h1>
        <ProfileForm user={user} />
        <div className="flex justify-end">
          <form action={signOutAction}>
            <button
              className={buttonStyles({ size: "md", variant: "danger" })}
              type="submit"
            >
              로그아웃
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
