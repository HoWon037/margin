"use client";

import { useActionState, useState } from "react";
import { signInWithPasswordAction, signUpWithPasswordAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { TabSwitch } from "@/components/ui/tab-switch";
import { TextField } from "@/components/ui/text-field";
import { Toast } from "@/components/ui/toast";
import { initialFormState } from "@/lib/form-state";

function LoginForm() {
  const [state, formAction, pending] = useActionState(
    signInWithPasswordAction,
    initialFormState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <TextField
        autoComplete="username"
        autoCapitalize="none"
        error={state.fieldErrors?.loginId?.[0]}
        label="아이디"
        name="loginId"
        placeholder="marginmina"
        required
        spellCheck={false}
      />
      <TextField
        autoComplete="current-password"
        error={state.fieldErrors?.password?.[0]}
        label="비밀번호"
        name="password"
        required
        type="password"
      />
      {state.message ? (
        <Toast
          title={state.message}
          tone={state.status === "success" ? "positive" : "negative"}
        />
      ) : null}
      <Button block disabled={pending} size="lg" type="submit">
        {pending ? "로그인 중..." : "로그인"}
      </Button>
    </form>
  );
}

function SignUpForm() {
  const [state, formAction, pending] = useActionState(
    signUpWithPasswordAction,
    initialFormState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <TextField
        autoComplete="username"
        autoCapitalize="none"
        error={state.fieldErrors?.loginId?.[0]}
        label="아이디"
        name="loginId"
        placeholder="marginmina"
        required
        spellCheck={false}
      />
      <TextField
        autoComplete="nickname"
        error={state.fieldErrors?.nickname?.[0]}
        label="이름"
        name="nickname"
        placeholder="민아"
        required
      />
      <TextField
        autoComplete="new-password"
        error={state.fieldErrors?.password?.[0]}
        label="비밀번호"
        name="password"
        required
        type="password"
      />
      <Select defaultValue="slate" label="아바타 색" name="avatarColor">
        <option value="slate">회색</option>
        <option value="violet">보라</option>
        <option value="lightBlue">하늘</option>
        <option value="green">초록</option>
        <option value="amber">호박</option>
      </Select>
      {state.message ? (
        <Toast
          title={state.message}
          tone={state.status === "success" ? "positive" : "negative"}
        />
      ) : null}
      <Button block disabled={pending} size="lg" type="submit">
        {pending ? "가입 중..." : "가입하기"}
      </Button>
    </form>
  );
}

export function EntryAuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");

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

      {mode === "login" ? <LoginForm key="login" /> : <SignUpForm key="signup" />}
    </div>
  );
}
