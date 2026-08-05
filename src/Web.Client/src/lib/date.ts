import { format, formatDistanceToNow, isPast, isToday, isTomorrow, startOfDay } from "date-fns";
import { tr } from "date-fns/locale";

export function formatDueDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (isToday(date)) {
    return "Bugün";
  }

  if (isTomorrow(date)) {
    return "Yarın";
  }

  return format(date, "d MMMM yyyy", { locale: tr });
}

export function isOverdue(value: string | null, isCompleted: boolean): boolean {
  if (!value || isCompleted) {
    return false;
  }

  return isPast(startOfDay(new Date(value))) && !isToday(new Date(value));
}

export function formatRelative(value: string): string {
  return formatDistanceToNow(new Date(value), { addSuffix: true, locale: tr });
}

export function toDateInputValue(value: string | null): string {
  if (!value) {
    return "";
  }

  return format(new Date(value), "yyyy-MM-dd");
}
