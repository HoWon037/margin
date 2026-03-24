import type { ToastTone } from "@/lib/types";

type SearchParams = Record<string, string | string[] | undefined>;

export function getStringParam(
  searchParams: SearchParams,
  key: string,
) {
  const value = searchParams[key];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function readToast(searchParams: SearchParams) {
  const title = getStringParam(searchParams, "toast");

  if (!title) {
    return null;
  }

  if (title === "로그아웃되었습니다") {
    return null;
  }

  const tone = getStringParam(searchParams, "tone");
  const description = getStringParam(searchParams, "description");
  const allowedTones: ToastTone[] = [
    "primary",
    "positive",
    "cautionary",
    "negative",
  ];

  return {
    title,
    description,
    tone: allowedTones.includes((tone as ToastTone) ?? "primary")
      ? (tone as ToastTone)
      : "primary",
  };
}
