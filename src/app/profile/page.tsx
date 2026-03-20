import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/forms/profile-form";
import { Avatar } from "@/components/ui/avatar";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUserSummary } from "@/lib/data/queries";

interface ProfilePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getReturnTo(
  value: string | string[] | undefined,
  fallback = "/groups",
) {
  const resolved = Array.isArray(value) ? value[0] : value;

  if (resolved && resolved.startsWith("/")) {
    return resolved;
  }

  return fallback;
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const resolvedSearchParams = await searchParams;
  const user = await getCurrentUserSummary();

  if (!user) {
    redirect("/");
  }

  const returnTo = getReturnTo(resolvedSearchParams.returnTo);

  return (
    <main className="mx-auto min-h-screen w-full max-w-[920px] px-4 py-10 sm:px-5 lg:py-14">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="type-title2 text-label-strong">프로필</h1>

          <Link
            className={buttonStyles({ size: "md", variant: "secondary" })}
            href={returnTo}
          >
            돌아가기
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
          <Card className="space-y-4">
            <div className="flex items-center gap-4 lg:flex-col lg:items-start">
              <Avatar name={user.nickname} size="lg" tone={user.avatarColor} />
              <div className="space-y-1">
                <p className="type-headline text-label-strong">{user.nickname}</p>
              </div>
            </div>
          </Card>

          <ProfileForm user={user} />
        </div>
      </div>
    </main>
  );
}
