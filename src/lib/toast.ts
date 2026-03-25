type SearchParams = Record<string, string | string[] | undefined>;
type RedirectToast = {
  title: string;
  description?: string;
  tone: "primary" | "positive" | "cautionary" | "negative";
};

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

export function readToast(searchParams: SearchParams): RedirectToast | null {
  void searchParams;
  return null;
}
