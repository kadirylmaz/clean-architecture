import { useState } from "react";
import { Calendar, Check, Copy, NotebookPen, Pencil, Trash2, User as UserIcon } from "lucide-react";
import { clsx } from "clsx";
import type { TodoResponse } from "@/api/types";
import { formatDueDate, isOverdue } from "@/lib/date";
import { useTodos } from "@/hooks/useTodos";
import { PriorityBadge } from "./PriorityBadge";
import { LabelChips } from "./LabelChips";
import { CompleteTodoModal } from "./CompleteTodoModal";
import { Menu } from "@/components/ui/Menu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface TodoItemCardProps {
  todo: TodoResponse;
  onEdit: (todo: TodoResponse) => void;
  /** Shows a short owner badge — used in the admin "every user's todos" view. */
  showOwner?: boolean;
}

export function TodoItemCard({ todo, onEdit, showOwner = false }: TodoItemCardProps) {
  const { deleteTodo, copyTodo } = useTodos();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const dueLabel = formatDueDate(todo.dueDate);
  const overdue = isOverdue(todo.dueDate, todo.isCompleted);

  return (
    <>
      <div
        className={clsx(
          "group flex items-start gap-4 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-100 transition-all hover:shadow-soft dark:bg-slate-900 dark:ring-slate-800",
          todo.isCompleted && "opacity-60",
        )}
      >
        <button
          onClick={() => !todo.isCompleted && setIsCompleting(true)}
          disabled={todo.isCompleted}
          aria-label={todo.isCompleted ? "Tamamlandı" : "Görevi tamamla"}
          className={clsx(
            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            todo.isCompleted
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-slate-300 text-transparent hover:border-brand-500 dark:border-slate-600",
          )}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p
              className={clsx(
                "break-words text-sm font-medium text-slate-900 dark:text-slate-100",
                todo.isCompleted && "line-through decoration-slate-400",
              )}
            >
              {todo.description}
            </p>
            <Menu
              items={[
                { label: "Düzenle", icon: <Pencil className="h-4 w-4" />, onClick: () => onEdit(todo) },
                { label: "Kopyala", icon: <Copy className="h-4 w-4" />, onClick: () => copyTodo.mutate(todo.id) },
                {
                  label: "Sil",
                  icon: <Trash2 className="h-4 w-4" />,
                  variant: "danger",
                  onClick: () => setIsConfirmingDelete(true),
                },
              ]}
            />
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <PriorityBadge priority={todo.priority} />
            {dueLabel && (
              <span
                className={clsx(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                  overdue
                    ? "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20"
                    : "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
                )}
              >
                <Calendar className="h-3 w-3" />
                {dueLabel}
                {overdue && " · Gecikti"}
              </span>
            )}
            <LabelChips labels={todo.labels} />
            {showOwner && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">
                <UserIcon className="h-3 w-3" />
                {todo.ownerName}
              </span>
            )}
          </div>

          {todo.isCompleted && todo.completionNotes && (
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-50/60 p-3 text-xs text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/5 dark:text-emerald-300 dark:ring-emerald-500/20">
              <NotebookPen className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p className="whitespace-pre-wrap">{todo.completionNotes}</p>
            </div>
          )}
        </div>
      </div>

      <CompleteTodoModal
        isOpen={isCompleting}
        onClose={() => setIsCompleting(false)}
        todoId={todo.id}
        todoDescription={todo.description}
      />

      <ConfirmDialog
        isOpen={isConfirmingDelete}
        onClose={() => setIsConfirmingDelete(false)}
        title="Görevi sil"
        description={`"${todo.description}" görevini silmek istediğinden emin misin? Bu işlem geri alınamaz.`}
        isLoading={deleteTodo.isPending}
        onConfirm={() =>
          deleteTodo.mutate(todo.id, {
            onSuccess: () => setIsConfirmingDelete(false),
          })
        }
      />
    </>
  );
}
