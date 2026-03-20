import type { BookStatus, GoalType, MemberRole } from "@/lib/types";

export function formatGoal(goalType: GoalType, value: number) {
  return goalType === "days"
    ? `일주일에 ${value}일 읽기`
    : `일주일에 ${value}페이지 읽기`;
}

export function formatPages(pages: number) {
  return `${pages}페이지`;
}

export function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function pluralize(value: number, noun: string) {
  if (noun === "day") {
    return `${value}일`;
  }

  if (noun === "group") {
    return `${value}개`;
  }

  return `${value}${noun}`;
}

export function generateInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function formatBookStatus(status: BookStatus) {
  return status === "reading" ? "읽는 중" : "완독";
}

export function formatMemberRole(role: MemberRole) {
  return role === "owner" ? "모임장" : "멤버";
}
