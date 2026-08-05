import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { LabelInput } from "./LabelInput";
import { PRIORITY_OPTIONS, Priority, type PriorityValue, type TodoResponse } from "@/api/types";
import { toDateInputValue } from "@/lib/date";
import { useTodos } from "@/hooks/useTodos";

interface TodoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** When set, the modal edits this todo instead of creating a new one. */
  todo?: TodoResponse | null;
}

export function TodoFormModal({ isOpen, onClose, todo }: TodoFormModalProps) {
  const { createTodo, updateTodo } = useTodos();
  const isEditMode = Boolean(todo);

  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<PriorityValue>(Priority.Normal);
  const [labels, setLabels] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDescription(todo?.description ?? "");
      setDueDate(toDateInputValue(todo?.dueDate ?? null));
      setPriority(todo?.priority ?? Priority.Normal);
      setLabels(todo?.labels ?? []);
      setError(null);
    }
  }, [isOpen, todo]);

  const isSubmitting = createTodo.isPending || updateTodo.isPending;

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError("Açıklama boş bırakılamaz.");
      return;
    }

    try {
      if (isEditMode && todo) {
        await updateTodo.mutateAsync({ id: todo.id, payload: { description: description.trim() } });
      } else {
        await createTodo.mutateAsync({
          description: description.trim(),
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          labels,
          priority,
        });
      }

      onClose();
    } catch {
      // toast handled centrally by the mutation hooks
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "Görevi düzenle" : "Yeni görev"}
      description={isEditMode ? "Görev açıklamasını güncelle." : "Yapılacaklar listene yeni bir görev ekle."}
      size="lg"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
        className="space-y-4"
      >
        <TextArea
          label="Açıklama"
          placeholder="Ör. Sunum dosyasını hazırla"
          rows={3}
          value={description}
          onChange={(event) => {
            setDescription(event.target.value);
            if (error) setError(null);
          }}
          error={error ?? undefined}
          autoFocus
        />

        {isEditMode ? (
          <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500 ring-1 ring-inset ring-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:ring-slate-800">
            Öncelik, son tarih ve etiketler yalnızca görev oluşturulurken belirlenebilir.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Son tarih
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="h-11 w-full rounded-xl border-0 bg-slate-100 px-4 text-sm text-slate-900 ring-1 ring-inset ring-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800/60 dark:text-slate-100 dark:ring-slate-700 [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
            <Select
              label="Öncelik"
              value={priority}
              onChange={(event) => setPriority(Number(event.target.value) as PriorityValue)}
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        )}

        {!isEditMode && <LabelInput labels={labels} onChange={setLabels} />}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditMode ? "Kaydet" : "Görev Ekle"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
