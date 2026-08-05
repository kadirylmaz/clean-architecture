import { Flame, ArrowUp, Equal, ArrowDown, Minus } from "lucide-react";
import { clsx } from "clsx";
import { Priority, type PriorityValue } from "@/api/types";

const config: Record<PriorityValue, { label: string; classes: string; icon: typeof Flame }> = {
  [Priority.Top]: {
    label: "En Yüksek",
    classes: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20",
    icon: Flame,
  },
  [Priority.High]: {
    label: "Yüksek",
    classes:
      "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-500/20",
    icon: ArrowUp,
  },
  [Priority.Medium]: {
    label: "Orta",
    classes: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20",
    icon: Equal,
  },
  [Priority.Low]: {
    label: "Düşük",
    classes: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20",
    icon: ArrowDown,
  },
  [Priority.Normal]: {
    label: "Normal",
    classes: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-500/20",
    icon: Minus,
  },
};

export function PriorityBadge({ priority, className }: { priority: PriorityValue; className?: string }) {
  const { label, classes, icon: Icon } = config[priority];

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        classes,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
