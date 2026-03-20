"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/app/actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { Toast } from "@/components/ui/toast";
import { AVATAR_SWATCHES } from "@/lib/constants";
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

  return (
    <Card className="space-y-5">
      <div className="flex items-center gap-4">
        <Avatar name={user.nickname} size="lg" tone={user.avatarColor} />
        <div className="space-y-1">
          <p className="type-headline text-label-strong">{user.nickname}</p>
          <p className="type-caption text-label-assistive">프로필 정보를 수정할 수 있습니다.</p>
        </div>
      </div>

      <form action={formAction} className="space-y-4">
        <TextField
          autoComplete="nickname"
          defaultValue={user.nickname}
          error={state.fieldErrors?.nickname?.[0]}
          label="닉네임"
          maxLength={24}
          name="nickname"
          required
        />
        <Select
          defaultValue={user.avatarColor}
          error={state.fieldErrors?.avatarColor?.[0]}
          label="아바타 색"
          name="avatarColor"
        >
          {AVATAR_SWATCHES.map((swatch) => (
            <option key={swatch.value} value={swatch.value}>
              {swatch.label}
            </option>
          ))}
        </Select>

        {state.message ? (
          <Toast
            title={state.message}
            tone={state.status === "success" ? "positive" : "negative"}
          />
        ) : null}

        <Button block disabled={pending} type="submit">
          {pending ? "저장하는 중..." : "프로필 저장하기"}
        </Button>
      </form>
    </Card>
  );
}
