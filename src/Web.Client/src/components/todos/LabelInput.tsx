import { type KeyboardEvent, useState } from "react";
import { Tag, X } from "lucide-react";

interface LabelInputProps {
  labels: string[];
  onChange: (labels: string[]) => void;
}

export function LabelInput({ labels, onChange }: LabelInputProps) {
  const [draft, setDraft] = useState("");

  const addLabel = () => {
    const value = draft.trim();

    if (value && !labels.includes(value)) {
      onChange([...labels, value]);
    }

    setDraft("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addLabel();
    } else if (event.key === "Backspace" && draft === "" && labels.length > 0) {
      onChange(labels.slice(0, -1));
    }
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Etiketler</label>
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2.5 ring-1 ring-inset ring-slate-200 focus-within:ring-2 focus-within:ring-brand-500 dark:bg-slate-800/60 dark:ring-slate-700">
        {labels.map((label) => (
          <span
            key={label}
            className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/20 dark:text-brand-300"
          >
            <Tag className="h-3 w-3" />
            {label}
            <button
              type="button"
              onClick={() => onChange(labels.filter((l) => l !== label))}
              className="ml-0.5 rounded-full hover:text-rose-600"
              aria-label={`${label} etiketini kaldır`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addLabel}
          placeholder={labels.length === 0 ? "Etiket ekle, Enter'a bas…" : ""}
          className="min-w-[100px] flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
        />
      </div>
      <p className="mt-1.5 text-xs text-slate-400">Enter veya virgül ile etiket ekleyebilirsin.</p>
    </div>
  );
}
