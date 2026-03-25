"use client";

import { useActionState, useState } from "react";
import { createGroupAction } from "@/app/actions";
import { getWeekStartDate, isMondayDateKey, toDateKey } from "@/lib/date";
import { GOAL_TYPE_OPTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import { Toast } from "@/components/ui/toast";
import { initialFormState } from "@/lib/form-state";

export function CreateGroupForm() {
  const [state, formAction, pending] = useActionState(
    createGroupAction,
    initialFormState,
  );
  const initialRecordStartDate = toDateKey(getWeekStartDate(new Date()));
  const [recordStartDate, setRecordStartDate] = useState(initialRecordStartDate);
  const localStartDateError =
    recordStartDate && !isMondayDateKey(recordStartDate)
      ? "기록 시작일은 월요일만 선택할 수 있습니다."
      : undefined;

  return (
    <form action={formAction} className="space-y-5">
      <TextField
        autoFocus
        error={state.fieldErrors?.groupName?.[0]}
        label="모임 이름"
        name="groupName"
        placeholder="여백 독서모임"
        required
      />
      <TextArea
        error={state.fieldErrors?.description?.[0]}
        label="모임 소개"
        maxLength={160}
        name="description"
        placeholder="한 주 동안 조금씩 읽고 짧은 기록을 남기는 모임"
      />
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_140px]">
        <Select
          defaultValue="days"
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
          defaultValue={3}
          error={state.fieldErrors?.weeklyGoalValue?.[0]}
          inputMode="numeric"
          label="목표 수치"
          min={1}
          name="weeklyGoalValue"
          pattern="[0-9]*"
          required
          type="number"
        />
      </div>
      <TextField
        error={state.fieldErrors?.recordStartDate?.[0] ?? localStartDateError}
        hint={
          state.fieldErrors?.recordStartDate?.[0] || localStartDateError
            ? undefined
            : "월요일만 선택할 수 있습니다."
        }
        label="기록 시작일"
        min={initialRecordStartDate}
        name="recordStartDate"
        onChange={(event) => setRecordStartDate(event.target.value)}
        required
        step={7}
        type="date"
        value={recordStartDate}
      />
      {state.message ? (
        <Toast
          title={state.message}
          tone={state.status === "success" ? "positive" : "negative"}
        />
      ) : null}
      <Button block disabled={pending || Boolean(localStartDateError)} size="lg" type="submit">
        {pending ? "모임 만드는 중..." : "모임 만들기"}
      </Button>
    </form>
  );
}
