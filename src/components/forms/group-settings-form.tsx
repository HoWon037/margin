"use client";

import { useActionState } from "react";
import { updateGroupSettingsAction } from "@/app/actions";
import { GOAL_TYPE_OPTIONS } from "@/lib/constants";
import { initialFormState } from "@/lib/form-state";
import type { GroupSummary } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import { Toast } from "@/components/ui/toast";

interface GroupSettingsFormProps {
  group: GroupSummary;
  isOwner: boolean;
}

export function GroupSettingsForm({
  group,
  isOwner,
}: GroupSettingsFormProps) {
  const [state, formAction, pending] = useActionState(
    updateGroupSettingsAction,
    initialFormState,
  );

  return (
    <Card className="space-y-5">
      <p className="type-headline text-label-strong">모임 정보</p>
      <form action={formAction} className="space-y-4">
        <input name="groupId" type="hidden" value={group.id} />
        <TextField
          defaultValue={group.name}
          disabled={!isOwner}
          error={state.fieldErrors?.groupName?.[0]}
          label="모임 이름"
          name="groupName"
        />
        <TextArea
          defaultValue={group.description}
          disabled={!isOwner}
          error={state.fieldErrors?.description?.[0]}
          label="모임 소개"
          maxLength={160}
          name="description"
        />
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_140px]">
          <Select
            defaultValue={group.weeklyGoalType}
            disabled={!isOwner}
            error={state.fieldErrors?.weeklyGoalType?.[0]}
            label="주간 목표 방식"
            name="weeklyGoalType"
          >
            {GOAL_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <TextField
            defaultValue={group.weeklyGoalValue}
            disabled={!isOwner}
            error={state.fieldErrors?.weeklyGoalValue?.[0]}
            inputMode="numeric"
            label="목표 수치"
            min={1}
            name="weeklyGoalValue"
            pattern="[0-9]*"
            type="number"
          />
        </div>
        {state.message ? (
          <Toast
            title={state.message}
            tone={state.status === "success" ? "positive" : "negative"}
          />
        ) : null}
        <Button block disabled={!isOwner || pending} type="submit">
          {isOwner
            ? pending
              ? "저장하는 중..."
              : "설정 저장하기"
            : "모임장만 가능"}
        </Button>
      </form>
    </Card>
  );
}
