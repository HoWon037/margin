import type { AvatarTone, BookStatus, GoalType } from "@/lib/types";

export const DEMO_GROUP_ID = "margin-circle";
export const DEMO_INVITE_CODE = "MARGIN7";
export const MAX_ACTIVE_READING_BOOKS = 2;

export const AVATAR_SWATCHES: Array<{
  value: AvatarTone;
  label: string;
  description: string;
}> = [
  { value: "violet", label: "보라", description: "차분한 보라" },
  { value: "lightBlue", label: "하늘", description: "맑은 하늘색" },
  { value: "green", label: "초록", description: "잔잔한 초록" },
  { value: "amber", label: "호박", description: "따뜻한 호박색" },
  { value: "slate", label: "회색", description: "절제된 회색" },
];

export const MOOD_TAGS = [
  "집중",
  "차분",
  "조용함",
  "피곤함",
  "호기심",
  "깊게 읽음",
] as const;

export const GOAL_TYPE_OPTIONS: Array<{
  value: GoalType;
  label: string;
}> = [
  { value: "days", label: "주간 읽은 날 수" },
  { value: "pages", label: "주간 읽은 페이지" },
];

export const BOOK_STATUS_OPTIONS: Array<{
  value: BookStatus;
  label: string;
}> = [
  { value: "reading", label: "읽는 중" },
  { value: "finished", label: "완독" },
];

export function getGroupNavigation(groupId: string) {
  return [
    { label: "피드", href: `/group/${groupId}` },
    { label: "멤버", href: `/group/${groupId}/members` },
    { label: "책", href: `/group/${groupId}/books` },
    { label: "이번 주", href: `/group/${groupId}/weekly` },
  ];
}
