export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function getTodayKey() {
  return toDateKey(new Date());
}

export function getWeekStartDate(referenceDate = new Date()) {
  const start = new Date(referenceDate);
  const day = start.getDay();
  const offset = day === 0 ? -6 : 1 - day;

  start.setDate(start.getDate() + offset);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function getWeekDates(referenceDate = new Date()) {
  const start = getWeekStartDate(referenceDate);

  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    return current;
  });
}

export function isMondayDateKey(dateKey: string) {
  return parseDateKey(dateKey).getDay() === 1;
}

const shortWeekdayFormatter = new Intl.DateTimeFormat("ko-KR", {
  weekday: "short",
});

const shortDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "numeric",
  day: "numeric",
});

const longDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  weekday: "long",
});

export function formatWeekdayShort(dateKey: string) {
  return shortWeekdayFormatter.format(parseDateKey(dateKey));
}

export function formatDateShort(dateKey: string) {
  return shortDateFormatter.format(parseDateKey(dateKey));
}

export function formatDateLong(dateKey: string) {
  return longDateFormatter.format(parseDateKey(dateKey));
}

export function getRelativeDateLabel(dateKey: string, referenceDate = new Date()) {
  const referenceKey = toDateKey(referenceDate);

  if (dateKey === referenceKey) {
    return "오늘";
  }

  const yesterday = new Date(referenceDate);
  yesterday.setDate(referenceDate.getDate() - 1);

  if (dateKey === toDateKey(yesterday)) {
    return "어제";
  }

  return formatDateShort(dateKey);
}
