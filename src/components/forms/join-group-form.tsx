"use client";

import { useActionState } from "react";
import { joinGroupAction } from "@/app/actions";
import { AVATAR_SWATCHES } from "@/lib/constants";
import { initialFormState } from "@/lib/form-state";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { Toast } from "@/components/ui/toast";

export function JoinGroupForm({ defaultCode }: { defaultCode?: string }) {
  const [state, formAction, pending] = useActionState(
    joinGroupAction,
    initialFormState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <TextField
        defaultValue={defaultCode}
        error={state.fieldErrors?.inviteCode?.[0]}
        label="초대 코드"
        name="inviteCode"
        placeholder="MARGIN7"
        required
      />
      <TextField
        error={state.fieldErrors?.nickname?.[0]}
        label="이름"
        name="nickname"
        placeholder="이름"
        required
      />
      <Select
        defaultValue="violet"
        error={state.fieldErrors?.avatarColor?.[0]}
        label="아바타 색상"
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
      <Button block disabled={pending} size="lg" type="submit">
        {pending ? "참여하는 중..." : "모임 참여하기"}
      </Button>
    </form>
  );
}
