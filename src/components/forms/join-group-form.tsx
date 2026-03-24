"use client";

import { useActionState } from "react";
import { joinGroupAction } from "@/app/actions";
import { initialFormState } from "@/lib/form-state";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { Toast } from "@/components/ui/toast";

export function JoinGroupForm() {
  const [state, formAction, pending] = useActionState(
    joinGroupAction,
    initialFormState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <TextField
        autoCapitalize="characters"
        autoCorrect="off"
        error={state.fieldErrors?.inviteCode?.[0]}
        label="초대 코드"
        name="inviteCode"
        required
        spellCheck={false}
      />
      {state.message ? (
        <Toast
          title={state.message}
          tone={state.status === "success" ? "positive" : "negative"}
        />
      ) : null}
      <Button block disabled={pending} size="lg" type="submit">
        {pending ? "들어가는 중..." : "모임 들어가기"}
      </Button>
    </form>
  );
}
