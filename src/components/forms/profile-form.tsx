"use client";

import { useActionState, useState } from "react";
import { updateProfileAction } from "@/app/actions";
import { AvatarUploadField } from "@/components/forms/avatar-upload-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TextField } from "@/components/ui/text-field";
import { Toast } from "@/components/ui/toast";
import { initialFormState } from "@/lib/form-state";
import type { UserSummary } from "@/lib/types";

interface ProfileFormProps {
  user: UserSummary;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialFormState,
  );
  const [nickname, setNickname] = useState(user.nickname);

  return (
    <Card className="space-y-6 rounded-[24px] px-5 py-6 sm:px-6 sm:py-7">
      <div className="space-y-1">
        <p className="type-headline text-label-strong">프로필 수정</p>
        <p className="type-body text-label-alternative">
          닉네임과 프로필 사진을 변경할 수 있습니다.
        </p>
      </div>

      <form action={formAction} className="space-y-5">
        <AvatarUploadField
          fileInputName="avatarFile"
          initialAvatarUrl={user.avatarUrl}
          name={nickname}
          initialTone={user.avatarColor}
          removeInputName="removeAvatar"
        />

        <div className="space-y-4">
          <TextField
            autoComplete="nickname"
            defaultValue={user.nickname}
            error={state.fieldErrors?.nickname?.[0]}
            label="닉네임"
            maxLength={24}
            name="nickname"
            onChange={(event) => setNickname(event.target.value)}
            required
          />
        </div>

        {state.status === "error" && state.message ? (
          <Toast
            title={state.message}
            tone="negative"
          />
        ) : null}

        <Button block disabled={pending} size="lg" type="submit">
          {pending ? "저장하는 중..." : "저장하기"}
        </Button>
      </form>
    </Card>
  );
}
