"use client";

import { useActionState, useState } from "react";
import { signInWithPasswordAction, signUpWithPasswordAction } from "@/app/actions";
import { AvatarUploadField } from "@/components/forms/avatar-upload-field";
import { Button } from "@/components/ui/button";
import { TabSwitch } from "@/components/ui/tab-switch";
import { TextField } from "@/components/ui/text-field";
import { Toast } from "@/components/ui/toast";
import { initialFormState } from "@/lib/form-state";

function LoginForm({ disabled }: { disabled: boolean }) {
  const [state, formAction, pending] = useActionState(
    signInWithPasswordAction,
    initialFormState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <TextField
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        disabled={disabled}
        error={state.fieldErrors?.loginId?.[0]}
        label="아이디"
        name="loginId"
        required
        spellCheck={false}
      />
      <TextField
        autoComplete="current-password"
        disabled={disabled}
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
      <Button block disabled={disabled || pending} size="lg" type="submit">
        {pending ? "로그인 중..." : "로그인"}
      </Button>
    </form>
  );
}

function SignUpForm({ disabled }: { disabled: boolean }) {
  const [state, formAction, pending] = useActionState(
    signUpWithPasswordAction,
    initialFormState,
  );
  const [nickname, setNickname] = useState("");

  return (
    <form action={formAction} className="space-y-4">
      <TextField
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        disabled={disabled}
        error={state.fieldErrors?.loginId?.[0]}
        label="아이디"
        name="loginId"
        required
        spellCheck={false}
      />
      <TextField
        autoComplete="new-password"
        disabled={disabled}
        error={state.fieldErrors?.password?.[0]}
        label="비밀번호"
        name="password"
        required
        type="password"
      />
      <TextField
        autoComplete="nickname"
        disabled={disabled}
        error={state.fieldErrors?.nickname?.[0]}
        label="닉네임"
        name="nickname"
        onChange={(event) => setNickname(event.target.value)}
        required
      />
      <div className="space-y-2">
        <p className="type-label text-label-strong">프로필 사진</p>
        <AvatarUploadField
          allowToneFallback
          fileInputName="avatarFile"
          name={nickname || "나"}
          initialTone="slate"
          removeInputName="removeAvatar"
          toneInputName="avatarColor"
        />
      </div>
      {state.message ? (
        <Toast
          title={state.message}
          tone={state.status === "success" ? "positive" : "negative"}
        />
      ) : null}
      <Button block disabled={disabled || pending} size="lg" type="submit">
        {pending ? "가입 중..." : "가입하기"}
      </Button>
    </form>
  );
}

export function EntryAuthForm({
  canSignIn,
  canSignUp,
}: {
  canSignIn: boolean;
  canSignUp: boolean;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const signInUnavailable = !canSignIn;
  const signUpUnavailable = !canSignUp;

  return (
    <div className="space-y-4">
      {signInUnavailable ? (
        <Toast
          description="Supabase 프로젝트 URL과 공개 키를 먼저 연결해 주세요."
          title="Supabase 연결이 아직 없습니다"
          tone="cautionary"
        />
      ) : null}

      <TabSwitch
        items={[
          { label: "로그인", value: "login" },
          { label: "가입", value: "signup" },
        ]}
        onChange={(nextValue) => setMode(nextValue as "login" | "signup")}
        value={mode}
      />

      {mode === "login" ? (
        <LoginForm disabled={signInUnavailable} key="login" />
      ) : (
        <SignUpForm disabled={signUpUnavailable} key="signup" />
      )}
    </div>
  );
}
