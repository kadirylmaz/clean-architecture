import { Tag } from "lucide-react";

export function LabelChips({ labels }: { labels: string[] }) {
  if (labels.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {labels.map((label) => (
        <span
          key={label}
          className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
        >
          <Tag className="h-3 w-3" />
          {label}
        </span>
      ))}
    </div>
  );
}
