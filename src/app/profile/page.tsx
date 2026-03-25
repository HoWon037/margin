import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/forms/profile-form";
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
      </div>
    </main>
  );
}
