"use client";

import { useActionState, useState } from "react";
import { signInWithPasswordAction, signUpWithPasswordAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { initialFormState } from "@/lib/form-state";
import { Select } from "@/components/ui/select";
import { TabSwitch } from "@/components/ui/tab-switch";
import { TextField } from "@/components/ui/text-field";

export function EntryAuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [signInState, signInAction, signInPending] = useActionState(
    signInWithPasswordAction,
    initialFormState,
  );
  const [signUpState, signUpAction, signUpPending] = useActionState(
    signUpWithPasswordAction,
    initialFormState,
  );

  const state = mode === "login" ? signInState : signUpState;
  const pending = mode === "login" ? signInPending : signUpPending;
  const formAction = mode === "login" ? signInAction : signUpAction;

  return (
    <div className="space-y-4">
      <TabSwitch
        items={[
          { label: "로그인", value: "login" },
          { label: "가입", value: "signup" },
        ]}
        onChange={(nextValue) => setMode(nextValue as "login" | "signup")}
        value={mode}
      />

      <form action={formAction} className="space-y-4">
        <TextField
          autoComplete="username"
          error={state.fieldErrors?.loginId?.[0]}
          label="아이디"
          name="loginId"
          placeholder="marginmina"
          required
        />
        {mode === "signup" ? (
          <TextField
            autoComplete="nickname"
            error={state.fieldErrors?.nickname?.[0]}
            label="이름"
            name="nickname"
            placeholder="민아"
            required
          />
        ) : null}
        <TextField
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          error={state.fieldErrors?.password?.[0]}
          label="비밀번호"
          name="password"
          required
          type="password"
        />
        {mode === "signup" ? (
          <Select defaultValue="slate" label="아바타 색" name="avatarColor">
            <option value="slate">회색</option>
            <option value="violet">보라</option>
            <option value="lightBlue">하늘</option>
            <option value="green">초록</option>
            <option value="amber">호박</option>
          </Select>
        ) : null}
        {state.message ? (
          <Toast
            title={state.message}
            tone={state.status === "success" ? "positive" : "negative"}
          />
        ) : null}
        <Button block disabled={pending} size="lg" type="submit">
          {pending
            ? mode === "login"
              ? "로그인 중..."
              : "가입 중..."
            : mode === "login"
              ? "로그인"
              : "가입하기"}
        </Button>
      </form>
    </div>
  );
}
